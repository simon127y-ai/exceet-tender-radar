module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Kostenlose lokale Übersetzungstabelle
  var translations = {
    // Französisch
    "fourniture": "Lieferung",
    "livraison": "Lieferung",
    "acquisition": "Beschaffung",
    "marché": "Auftrag",
    "carte": "Karte",
    "cartes": "Karten",
    "chipkarte": "Chipkarte",
    "puce": "Chip",
    "puces": "Chips",
    "support": "Träger",
    "supports": "Träger",
    "titre": "Ticket",
    "titres": "Tickets",
    "transport": "Transport",
    "restaurant": "Restaurant",
    "personnalisation": "Personalisierung",
    "pré-personnalisation": "Vorpersonalisierung",
    "impression": "Druck",
    "fabrication": "Herstellung",
    "production": "Produktion",
    "services": "Dienstleistungen",
    "associées": "zugehörige",
    "prestations": "Leistungen",
    "pour": "für",
    "et": "und",
    "de": "von",
    "des": "der",
    "les": "die",
    "la": "die",
    "le": "der",
    "du": "des",
    "aux": "zu den",
    "en": "in",
    "avec": "mit",
    "sans": "ohne",
    "ou": "oder",
    "sur": "auf",
    "par": "durch",
    "une": "eine",
    "un": "ein",
    "agents": "Mitarbeiter",
    "commune": "Gemeinde",
    "ville": "Stadt",
    "région": "Region",
    "département": "Département",
    "métropole": "Metropole",
    "occasionnels": "Gelegenheits-",
    "souples": "flexibel",
    "calypso": "Calypso",
    "billettique": "Ticketing",
    "identification": "Identifikation",
    "accès": "Zugang",
    "sécurité": "Sicherheit",
    "bancaire": "Bank-",
    "bancaires": "Bank-",
    "paiement": "Zahlung",
    "crédit": "Kredit",
    "débit": "Debit",
    "électronique": "elektronisch",
    "électroniques": "elektronische",
    "système": "System",
    "national": "national",
    "contrat": "Vertrag",
    "cadre": "Rahmen",
    "accord": "Vereinbarung",
    
    // Polnisch
    "dostawa": "Lieferung",
    "karty": "Karten",
    "kart": "Karten",
    "karnety": "Eintrittskarten",
    "karnetów": "Eintrittskarten",
    "uprawniających": "berechtigende",
    "korzystania": "Nutzung",
    "usług": "Dienstleistungen",
    "sportowych": "Sport-",
    "rekreacyjnych": "Freizeit-",
    "pracowników": "Mitarbeiter",
    "dla": "für",
    "do": "zu",
    "oraz": "und",
    "lub": "oder",
    "na": "auf",
    "od": "von",
    "ze": "mit",
    "uniwersytet": "Universität",
    "szpital": "Krankenhaus",
    "kliniczny": "klinisch",
    
    // Spanisch
    "suministro": "Lieferung",
    "tarjetas": "Karten",
    "tarjeta": "Karte",
    "servicios": "Dienstleistungen",
    "contrato": "Vertrag",
    "adquisición": "Beschaffung",
    "producción": "Produktion",
    
    // Italienisch
    "fornitura": "Lieferung",
    "schede": "Karten",
    "carta": "Karte",
    "servizi": "Dienstleistungen",
    "contratto": "Vertrag",
    
    // Rumänisch
    "cartele": "Karten",
    "tahografice": "Tachographen-",
    "personalizate": "personalisierte",
    "autoritatea": "Behörde",
    "administrativă": "Verwaltungs-",
    "agenția": "Agentur",
    "națională": "nationale",
    
    // Englisch
    "supply": "Lieferung",
    "delivery": "Lieferung",
    "cards": "Karten",
    "card": "Karte",
    "chip": "Chip",
    "smart": "Smart",
    "smartcard": "Chipkarte",
    "access": "Zugang",
    "payment": "Zahlung",
    "services": "Dienstleistungen",
    "contract": "Vertrag",
    "framework": "Rahmen",
    "agreement": "Vereinbarung",
    "procurement": "Beschaffung",
    "production": "Produktion",
    "printing": "Druck",
    "personalization": "Personalisierung",
    "personalisation": "Personalisierung"
  };
  
  // Ländernamen übersetzen
  var countryNames = {
    "FR": "Frankreich",
    "DE": "Deutschland",
    "AT": "Österreich",
    "PL": "Polen",
    "ES": "Spanien",
    "IT": "Italien",
    "NL": "Niederlande",
    "BE": "Belgien",
    "PT": "Portugal",
    "CZ": "Tschechien",
    "RO": "Rumänien",
    "HU": "Ungarn",
    "SK": "Slowakei",
    "BG": "Bulgarien",
    "HR": "Kroatien",
    "SI": "Slowenien",
    "LT": "Litauen",
    "LV": "Lettland",
    "EE": "Estland",
    "FI": "Finnland",
    "SE": "Schweden",
    "DK": "Dänemark",
    "IE": "Irland",
    "GR": "Griechenland",
    "CY": "Zypern",
    "LU": "Luxemburg",
    "MT": "Malta",
    "MDA": "Moldau",
    "MD": "Moldau"
  };
  
  // CPV-Kategorien
  var cpvCategories = {
    "30162": "Chipkarten",
    "30161": "Bankkarten",
    "22457": "Zugangskarten"
  };
  
  function translateTitle(title, country) {
    if (!title) return "";
    
    // Hol Ländername
    var countryName = countryNames[country] || country;
    
    // Bestimme CPV-Kategorie aus Titel
    var category = "Chipkarten";
    var lowerTitle = title.toLowerCase();
    if (lowerTitle.indexOf("bank") !== -1 || lowerTitle.indexOf("crédit") !== -1 || 
        lowerTitle.indexOf("paiement") !== -1 || lowerTitle.indexOf("payment") !== -1) {
      category = "Bankkarten";
    } else if (lowerTitle.indexOf("accès") !== -1 || lowerTitle.indexOf("access") !== -1 ||
               lowerTitle.indexOf("transport") !== -1 || lowerTitle.indexOf("ticket") !== -1 ||
               lowerTitle.indexOf("titre") !== -1) {
      category = "Zugangskarten";
    } else if (lowerTitle.indexOf("restaurant") !== -1 || lowerTitle.indexOf("gutschein") !== -1) {
      category = "Essensgutscheine";
    } else if (lowerTitle.indexOf("karnet") !== -1 || lowerTitle.indexOf("eintritt") !== -1) {
      category = "Eintrittskarten";
    } else if (lowerTitle.indexOf("tahograf") !== -1 || lowerTitle.indexOf("tachograph") !== -1) {
      category = "Chipkarten";
    }
    
    // Übersetze wichtige Wörter
    var translatedTitle = title;
    var words = Object.keys(translations);
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var regex = new RegExp("\\b" + word + "\\b", "gi");
      translatedTitle = translatedTitle.replace(regex, translations[word]);
    }
    
    // Format: "Land – Kategorie – Übersetzter Titel"
    return countryName + " – " + category + " – " + translatedTitle;
  }
  
  // exceet Card Group - NUR KARTEN-CPV-Codes
  var cpvCodes = [
    "30162000",
    "30161000",
    "22457000"
  ];
  
  // Datum vor 12 Monaten
  var oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  var dateFilter = oneYearAgo.toISOString().split("T")[0].replace(/-/g, "");
  
  try {
    var tedResponse = await fetch("https://api.ted.europa.eu/v3/notices/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query: "PD>" + dateFilter + " AND (" + cpvCodes.map(function(c) { return "PC=" + c; }).join(" OR ") + ")",
        fields: ["notice-title", "buyer-name", "publication-number", "CY", "TV", "deadline-receipt-request", "publication-date", "PC"],
        limit: 100,
        page: 1
      })
    });
    
    if (!tedResponse.ok) {
      throw new Error("TED API error: " + tedResponse.status);
    }
    
    var tedData = await tedResponse.json();
    var notices = tedData.notices || [];
    
    // NUR Karten-Keywords
    var cardKeywords = [
      "chipkarte", "smartcard", "smart card", "chip card", "chipkarten",
      "karte", "card", "karten", "cards", "carte", "cartes", "tarjeta",
      "bankkarte", "kreditkarte", "credit card", "debit card", "bank card",
      "zutrittskarte", "access card", "zugangskarte",
      "mitarbeiterausweis", "employee card", "badge", "ausweis",
      "kundenkarte", "loyalty card", "mitgliedskarte",
      "geschenkkarte", "gift card", "gutschein", "voucher",
      "fahrkarte", "transport card", "ticket card", "ticket",
      "titre", "titres", "support", "supports", "cartele", "karnety"
    ];
    
    // Ausschluss
    var excludeKeywords = [
      "kartenleser", "card reader", "lesegerät", "reader", "terminal", "lecteur",
      "armband", "bracelet", "wristband",
      "software", "system", "server", "datenbank", "database",
      "drucker", "printer", "scanner",
      "wartung", "maintenance", "reparatur", "repair",
      "beratung", "consulting", "schulung", "training",
      "möbel", "furniture", "gebäude", "building",
      "papier", "paper", "büro", "office"
    ];
    
    var tenders = [];
    
    for (var idx = 0; idx < notices.length; idx++) {
      var notice = notices[idx];
      var pubNum = notice["publication-number"] || ("ted-" + idx);
      
      var titleObj = notice["notice-title"] || {};
      var title = titleObj.deu || titleObj.eng || titleObj.fra || titleObj.spa || titleObj.pol || Object.values(titleObj)[0] || "";
      if (Array.isArray(title)) title = title[0];
      
      var searchText = title.toLowerCase();
      var cpvCode = notice.PC ? notice.PC[0] : "";
      
      // Ausschluss prüfen
      var isExcluded = excludeKeywords.some(function(kw) {
        return searchText.indexOf(kw) !== -1;
      });
      if (isExcluded) continue;
      
      // Karten-Relevanz prüfen
      var isCard = cardKeywords.some(function(kw) {
        return searchText.indexOf(kw) !== -1;
      });
      
      if (cpvCode.indexOf("30162") === 0 || cpvCode.indexOf("30161") === 0) {
        isCard = true;
      }
      
      if (!isCard) continue;
      
      // Auftraggeber
      var buyerObj = notice["buyer-name"] || {};
      var buyer = buyerObj.deu || buyerObj.eng || Object.values(buyerObj)[0] || "Öffentlicher Auftraggeber";
      if (Array.isArray(buyer)) buyer = buyer[0];
      
      // Land
      var country = notice.CY ? notice.CY[0] : "EU";
      
      // Wert
      var value = notice.TV ? notice.TV.toString() : "";
      
      // Deadline
      var deadline = notice["deadline-receipt-request"] ? notice["deadline-receipt-request"][0] : null;
      if (deadline) deadline = deadline.split("T")[0];
      
      // Kategorie
      var category = "Retail";
      if (searchText.indexOf("ausweis") !== -1 || searchText.indexOf("führerschein") !== -1 || 
          searchText.indexOf("identity") !== -1 || searchText.indexOf("id card") !== -1) {
        category = "Government";
      } else if (searchText.indexOf("bank") !== -1 || searchText.indexOf("kredit") !== -1 || 
                 searchText.indexOf("credit") !== -1 || searchText.indexOf("zahlung") !== -1 ||
                 searchText.indexOf("payment") !== -1 || searchText.indexOf("paiement") !== -1 ||
                 cpvCode.indexOf("30161") === 0) {
        category = "Banking";
      } else if (searchText.indexOf("zutritt") !== -1 || searchText.indexOf("access") !== -1 || 
                 searchText.indexOf("transport") !== -1 || searchText.indexOf("fahrkarte") !== -1 ||
                 searchText.indexOf("ticket") !== -1 || searchText.indexOf("accès") !== -1 ||
                 searchText.indexOf("titre") !== -1 ||
                 cpvCode.indexOf("22457") === 0) {
        category = "Access/Transport";
      }
      
      // Übersetze Titel
      var germanTitle = translateTitle(title, country);
      
      tenders.push({
        id: pubNum,
        title: germanTitle,
        authority: buyer,
        country: country,
        value: value,
        deadline: deadline,
        source: "TED EU",
        category: category,
        description: germanTitle,
        tedUrl: "https://ted.europa.eu/de/notice/-/detail/" + pubNum,
        noticeId: pubNum,
        publicationDate: notice["publication-date"] || null,
        cpv: cpvCode
      });
    }
    
    // Nach Datum sortieren
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
