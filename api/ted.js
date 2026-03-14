module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // OpenAI API Key (Base64 encoded for Node.js)
  var encodedKey = "c2stcHJvai1WeE5INU1Rel9NJLW1DZmdwVnpZVEZkQ1Y0RlVVd2V4WTJxRWt4N0Jhckw2YWhXYXVpWjdRdHZwYjQ2Ymo0R2dLYWU4V3ZWdGdRVDNCbGJrRkpra09MeGp1WDQ3emJEMVJXbGV1OVFqckJvV3BRQ3ZvdXo5SUtkcWhnbmptaHRiZlByV0E5QVBZNWs4SFlYZ3k4ckZzTWNB";
  var OPENAI_KEY = Buffer.from(encodedKey, 'base64').toString('utf-8');
  
  // Ländernamen
  var countryNames = {
    "FR": "Frankreich", "DE": "Deutschland", "AT": "Österreich", "PL": "Polen",
    "ES": "Spanien", "IT": "Italien", "NL": "Niederlande", "BE": "Belgien",
    "PT": "Portugal", "CZ": "Tschechien", "RO": "Rumänien", "HU": "Ungarn",
    "SK": "Slowakei", "BG": "Bulgarien", "HR": "Kroatien", "SI": "Slowenien",
    "LT": "Litauen", "LV": "Lettland", "EE": "Estland", "FI": "Finnland",
    "SE": "Schweden", "DK": "Dänemark", "IE": "Irland", "GR": "Griechenland",
    "CY": "Zypern", "LU": "Luxemburg", "MT": "Malta", "MDA": "Moldau", "MD": "Moldau"
  };

  // OpenAI Übersetzung
  async function translateToGerman(text) {
    if (!text || text.length < 3) return text;
    
    // Prüfe ob bereits deutsch
    var germanIndicators = ["Lieferung", "Karten", "Chipkarten", "Ausschreibung", "Beschaffung", "und", "für", "der", "die"];
    var lowerText = text.toLowerCase();
    var count = 0;
    for (var i = 0; i < germanIndicators.length; i++) {
      if (lowerText.indexOf(germanIndicators[i].toLowerCase()) !== -1) count++;
    }
    if (count >= 3) return text;
    
    try {
      var response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENAI_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: "Übersetze diesen Ausschreibungstitel ins Deutsche. Gib NUR die Übersetzung zurück:\n\n" + text
          }],
          temperature: 0.2,
          max_tokens: 150
        })
      });
      
      if (response.ok) {
        var data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content.trim();
        }
      }
    } catch (e) {
      console.error("Translation error:", e.message);
    }
    return text;
  }
  
  // exceet relevante CPV-Codes (nur Karten)
  var cpvCodes = ["30162000", "30161000", "22457000"];
  
  // Datum vor 12 Monaten
  var oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  var dateFilter = oneYearAgo.toISOString().split("T")[0].replace(/-/g, "");
  
  try {
    // TED API Anfrage
    var tedResponse = await fetch("https://api.ted.europa.eu/v3/notices/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query: "PD>" + dateFilter + " AND (" + cpvCodes.map(function(c) { return "PC=" + c; }).join(" OR ") + ")",
        fields: ["notice-title", "buyer-name", "publication-number", "CY", "TV", "deadline-receipt-request", "publication-date", "PC", "ND"],
        limit: 100,
        page: 1
      })
    });
    
    if (!tedResponse.ok) {
      var errorText = await tedResponse.text();
      throw new Error("TED API error " + tedResponse.status + ": " + errorText.substring(0, 200));
    }
    
    var tedData = await tedResponse.json();
    var notices = tedData.notices || [];
    
    // Strenge Karten-Keywords (muss enthalten)
    var cardKeywords = [
      "chipkarte", "smartcard", "smart card", "chipkarten", "smart cards",
      "carte", "cartes", "card", "cards", "karte", "karten",
      "tarjeta", "tarjetas", "scheda", "schede", "cartele",
      "bank", "crédit", "credit", "debit", "paiement", "payment", "zahlung",
      "titre", "titres", "ticket", "tickets", "billet",
      "support", "supports", "calypso", "transport",
      "accès", "access", "zugang", "zutritt",
      "badge", "ausweis", "identité", "identity",
      "tahograf", "tachograph", "tachographe"
    ];
    
    // Ausschluss-Keywords (darf NICHT enthalten)
    var excludeKeywords = [
      "reader", "lecteur", "lesegerät", "terminal", "terminaux",
      "armband", "bracelet", "wristband",
      "software", "logiciel", "système", "system",
      "printer", "drucker", "imprimante",
      "scanner", "machine",
      "maintenance", "wartung", "entretien",
      "consulting", "beratung", "conseil",
      "formation", "schulung", "training",
      "mobilier", "möbel", "furniture",
      "véhicule", "fahrzeug", "vehicle",
      "bâtiment", "gebäude", "building"
    ];
    
    var tenders = [];
    
    // Verarbeite Notices
    for (var idx = 0; idx < notices.length; idx++) {
      var notice = notices[idx];
      
      // Titel extrahieren
      var titleObj = notice["notice-title"] || {};
      var title = "";
      if (titleObj.deu) title = Array.isArray(titleObj.deu) ? titleObj.deu[0] : titleObj.deu;
      else if (titleObj.eng) title = Array.isArray(titleObj.eng) ? titleObj.eng[0] : titleObj.eng;
      else if (titleObj.fra) title = Array.isArray(titleObj.fra) ? titleObj.fra[0] : titleObj.fra;
      else {
        var vals = Object.values(titleObj);
        if (vals.length > 0) title = Array.isArray(vals[0]) ? vals[0][0] : vals[0];
      }
      
      if (!title) continue;
      
      var searchText = title.toLowerCase();
      var cpvCode = notice.PC ? (Array.isArray(notice.PC) ? notice.PC[0] : notice.PC) : "";
      
      // Ausschluss prüfen
      var excluded = false;
      for (var e = 0; e < excludeKeywords.length; e++) {
        if (searchText.indexOf(excludeKeywords[e]) !== -1) {
          excluded = true;
          break;
        }
      }
      if (excluded) continue;
      
      // Karten-Relevanz prüfen
      var isRelevant = false;
      for (var k = 0; k < cardKeywords.length; k++) {
        if (searchText.indexOf(cardKeywords[k]) !== -1) {
          isRelevant = true;
          break;
        }
      }
      
      // CPV direkt relevant
      if (cpvCode.indexOf("30162") === 0 || cpvCode.indexOf("30161") === 0 || cpvCode.indexOf("22457") === 0) {
        isRelevant = true;
      }
      
      if (!isRelevant) continue;
      
      // Publikationsnummer für Link
      var pubNum = notice["publication-number"] || "";
      if (Array.isArray(pubNum)) pubNum = pubNum[0];
      
      // Notice Document ID für korrekten Link
      var ndId = notice["ND"] || notice["nd"] || "";
      if (Array.isArray(ndId)) ndId = ndId[0];
      
      // Auftraggeber
      var buyerObj = notice["buyer-name"] || {};
      var buyer = "";
      if (buyerObj.deu) buyer = Array.isArray(buyerObj.deu) ? buyerObj.deu[0] : buyerObj.deu;
      else if (buyerObj.eng) buyer = Array.isArray(buyerObj.eng) ? buyerObj.eng[0] : buyerObj.eng;
      else {
        var bVals = Object.values(buyerObj);
        if (bVals.length > 0) buyer = Array.isArray(bVals[0]) ? bVals[0][0] : bVals[0];
      }
      if (!buyer) buyer = "Öffentlicher Auftraggeber";
      
      // Land
      var country = notice.CY ? (Array.isArray(notice.CY) ? notice.CY[0] : notice.CY) : "EU";
      var countryName = countryNames[country] || country;
      
      // Wert
      var value = notice.TV ? notice.TV.toString() : "";
      if (Array.isArray(value)) value = value[0];
      
      // Deadline
      var deadline = notice["deadline-receipt-request"] || null;
      if (Array.isArray(deadline)) deadline = deadline[0];
      if (deadline) deadline = deadline.split("T")[0];
      
      // Publikationsdatum
      var pubDate = notice["publication-date"] || "";
      if (Array.isArray(pubDate)) pubDate = pubDate[0];
      
      // Kategorie bestimmen
      var category = "Retail";
      if (searchText.indexOf("ausweis") !== -1 || searchText.indexOf("identité") !== -1 || 
          searchText.indexOf("identity") !== -1 || searchText.indexOf("passport") !== -1 ||
          searchText.indexOf("führerschein") !== -1 || searchText.indexOf("permis") !== -1) {
        category = "Government";
      } else if (searchText.indexOf("bank") !== -1 || searchText.indexOf("crédit") !== -1 || 
                 searchText.indexOf("credit") !== -1 || searchText.indexOf("paiement") !== -1 ||
                 searchText.indexOf("payment") !== -1 || searchText.indexOf("zahlung") !== -1 ||
                 cpvCode.indexOf("30161") === 0) {
        category = "Banking";
      } else if (searchText.indexOf("transport") !== -1 || searchText.indexOf("titre") !== -1 ||
                 searchText.indexOf("ticket") !== -1 || searchText.indexOf("accès") !== -1 ||
                 searchText.indexOf("access") !== -1 || searchText.indexOf("calypso") !== -1 ||
                 cpvCode.indexOf("22457") === 0) {
        category = "Access/Transport";
      }
      
      // Übersetze Titel auf Deutsch
      var germanTitle = await translateToGerman(title);
      
      // Formatierter Titel mit Land und Kategorie
      var formattedTitle = countryName + " – " + germanTitle;
      
      // TED Link - verschiedene Formate probieren
      var tedUrl = "";
      if (pubNum) {
        // Neues TED Format
        tedUrl = "https://ted.europa.eu/de/notice/-/detail/" + pubNum;
      }
      
      tenders.push({
        id: pubNum || ("ted-" + idx),
        title: formattedTitle,
        authority: buyer,
        country: country,
        value: value,
        deadline: deadline,
        source: "TED EU",
        category: category,
        description: germanTitle,
        tedUrl: tedUrl,
        noticeId: pubNum,
        publicationDate: pubDate,
        cpv: cpvCode
      });
    }
    
    // Nach Datum sortieren (neueste zuerst)
    tenders.sort(function(a, b) {
      return (b.publicationDate || "").localeCompare(a.publicationDate || "");
    });

    return res.status(200).json({
      success: true,
      count: tenders.length,
      totalFromTED: notices.length,
      tenders: tenders,
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      tenders: []
    });
  }
};
