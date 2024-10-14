const queryDict = {
  personInfo: `SELECT ?image ?natmus ?dimu  ?viaf ?itemDescription ?commonscat ?item ?itemLabel ?dob ?dod ?kulturnav ?article (SAMPLE(?thumbnail) AS ?thumb) WHERE {
    VALUES ?item {
      wd:__qid__
    }
    OPTIONAL {?item wdt:P7847 ?dimu}
    OPTIONAL {?item wdt:P2538 ?natmus}
    OPTIONAL { ?item wdt:P569 ?dob. }
    OPTIONAL { ?item wdt:P570 ?dod. }
    OPTIONAL { ?item wdt:P1248 ?kulturnav. }
    OPTIONAL { ?item wdt:P214 ?viaf. }
    OPTIONAL {?item wdt:P373 ?commonscat}
    OPTIONAL {?item wdt:P18 ?image
    BIND(REPLACE(wikibase:decodeUri(STR(?image)), "http://commons.wikimedia.org/wiki/Special:FilePath/", "") AS ?fileName)
    BIND(REPLACE(?fileName, " ", "_") AS ?safeFileName)
    BIND(MD5(?safeFileName) AS ?fileNameMD5)
    BIND(CONCAT("https://upload.wikimedia.org/wikipedia/commons/thumb/", SUBSTR(?fileNameMD5, 1 , 1 ), "/", SUBSTR(?fileNameMD5, 1 , 2 ), "/", ?safeFileName, "/300px-", ?safeFileName) AS ?thumbnail)}
    OPTIONAL {
    ?article schema:about ?item;
    schema:isPartOf <https://sv.wikipedia.org/>.
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "sv,en". }
  }
    GROUP BY ?item ?image ?itemLabel ?itemDescription ?dob ?dod ?kulturnav ?natmus ?article ?commonscat ?dimu ?viaf`,
  personBuildings: `SELECT ?ksamsok ?article ?itemDescription ?commonscat ?kulturnav ?locationLabel (SAMPLE(?thumbnail) AS ?thumb) (SAMPLE(?inception) AS ?year) ?image ?item ?itemLabel ?lat ?lon (GROUP_CONCAT(DISTINCT ?instance; SEPARATOR = ", ") AS ?types) WHERE {
    ?item wdt:P84 wd:__qid__;
    wdt:P625 ?coords;
    p:P625 ?statement.
    ?statement psv:P625 ?node.
    ?node wikibase:geoLatitude ?lat;
      wikibase:geoLongitude ?lon.
      OPTIONAL {?item wdt:P1248 ?kulturnav}
      OPTIONAL {?item wdt:P373 ?commonscat}
      OPTIONAL {?item wdt:P1260 ?ksamsok}
      OPTIONAL {?item wdt:P17 ?location}
          OPTIONAL {
      ?article schema:about ?item;
        schema:isPartOf <https://sv.wikipedia.org/>.
    }
      OPTIONAL {?item wdt:P18 ?image
      BIND(REPLACE(wikibase:decodeUri(STR(?image)), "http://commons.wikimedia.org/wiki/Special:FilePath/", "") AS ?fileName)
      BIND(REPLACE(?fileName, " ", "_") AS ?safeFileName)
      BIND(MD5(?safeFileName) AS ?fileNameMD5)
      BIND(CONCAT("https://upload.wikimedia.org/wikipedia/commons/thumb/", SUBSTR(?fileNameMD5, 1 , 1 ), "/", SUBSTR(?fileNameMD5, 1 , 2 ), "/", ?safeFileName, "/180px-", ?safeFileName) AS ?thumbnail)}
    ?item wdt:P31 ?instance.
      OPTIONAL {
      ?item wdt:P571 ?date.
      BIND(STR(YEAR(?date)) AS ?inception)
    }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "sv,en,nb,nn,da,fi,nl,de,es,pt,fr,pl". }
  }
  GROUP BY ?ksamsok ?commonscat ?article ?item ?itemLabel ?lat ?lon ?year ?thumb ?image ?kulturnav ?locationLabel ?itemDescription
  ORDER BY (?itemLabel)`,
};

const iconDict = {
  bridge: "assets/icon-bridge.png", // Map marker icon – Nicolas Mollet – Old bridge – Tourism – iOS.png
  cemetery: "assets/icon-cemetery.png", // Map marker icon – Nicolas Mollet – Cemetery – Tourism – iOS.png
  church: "assets/icon-church.png", // Map marker icon – Nicolas Mollet – Church – Tourism – iOS.png
  commons: "assets/commons-icon-tiny.png",
  theatre: "assets/icon-theatre.png", // Map marker icon – Nicolas Mollet – Theater – Culture & Entertainment – iOS.png
  default: "assets/icon-default.png", // Map marker icon – Nicolas Mollet – Home – People – iOS.png
  education: "assets/icon-education.png", // Map marker icon – Nicolas Mollet – High School – Health & Education – iOS.png
  library: "assets/icon-library.png", // Map marker icon – Nicolas Mollet – Library – Culture & Entertainment – iOS.png
  lighthouse: "assets/icon-lighthouse.png", // Map marker icon – Nicolas Mollet – Lighthouse – Tourism – iOS.png
  museum: "assets/icon-museum.png", // Map marker icon – Nicolas Mollet – Art museum – Culture & Entertainment – iOS.png
  palace: "assets/icon-palace.png", // Map marker icon – Nicolas Mollet – Palace – Tourism – iOS.png
  sports: "assets/icon-sports.png", // Map marker icon – Nicolas Mollet – Indoor Sports Pavilion – Sports – iOS.png
  station: "assets/icon-train.png", // Map marker icon – Nicolas Mollet – Level crossing – Transportation – iOS.png
  wikidata: "assets/wikidata-icon-tiny.png",
  mosque: "assets/icon-mosque.png", // Map marker icon – Nicolas Mollet – Mosque – Tourism – iOS.png
  wikipedia: "assets/wikipedia-icon-tiny.png",
  information: "assets/icon-information.png", // Map marker icon – Nicolas Mollet – Information – Offices – iOS.png
};
const qDict = {
  station: [
    "Q55488", // train station
    "Q55493", // goods station
    "Q1339195", // station building
    "Q4663385", // former train station
    "Q115485166", // railway station without passenger service
    "Q14562709", // london underground station
    "Q18543139", // central station
    "Q928830", // metro station
    "Q22808403", // underground station
    "Q22808404", // station located on surface
    "Q65464941", // former railway stop
  ],
  theatre: [
    "Q24354", // theatre building
    "Q153562", // opera house
  ],
  bridge: [
    "Q1068842", // footbridge
    "Q12280", // bridge
    "Q13928782", // double beam drawbridge
    "Q158438", // arch bridge
    "Q158555", // cable stayed bridge
    "Q181348", // viaduct
    "Q2502622", // bicycle bridge
    "Q3397411", // fixed bridge
    "Q3397526", // stone bridge
    "Q5159064", // concrete bridge
    "Q537127", // road bridge
    "Q14276458", // deck arch bridge
  ],
  education: [
    "Q10497462", // folkskola i Sverige
    "Q10511371", // gymnasieskola
    "Q10509147", // comprehensive school finland
    "Q11960248", // combined primary and lower secondary school
    "Q1244442", // school building
    "Q1800213", // primary school norway
    "Q19844914", // university building
    "Q209465", // university campus
    "Q3914", // school
    "Q3918", // university
    "Q513984", // folkskola
    "Q875538", // public university
    "Q10572388", // läroverk
    "Q9826", // high school
  ],
  church: [
    "Q108325", //chapel
    "Q728266", // hall church
    "Q1129743", // filial church
    "Q1457501", // cemetery chapel
    "Q16970", // church building
    "Q2031836", // eastern orthodox church building
    "Q56242225", // eastern orthodox cathedral
    "Q2977", // cathedral
    "Q317557", // parish church
    "Q44539", // temple
    "Q55237413", // church building of svenska kyrkan
    "Q56242215", // catholic cathedral
    "Q56242235", // lutheran cathedral
    "Q744296", // wooden church
    "Q56242063", // protestant church building
    "Q1088552", // catholic church building
    "Q56242275", // lutheran church
    "Q120560", // minor basilica
  ],
  sports: [
    "Q641226", // arena
    "Q27951514", // indoor arena
    "Q1076486", // sports venue
    "Q483110", // stadion
    "Q1154710", // football stadium
    "Q830528", // velodrom
    "Q20981001", // proposed sports venue
    "Q1049757", // multipurpose sports venue
    "Q589481", // olympic stadium
    "Q7579839", // sports complex
    "Q595452", // baseball venue
    "Q74539696", // defunct sports venue
    "Q741118", // tennis court
    "Q357380", // indoor swimming pool
  ],
  palace: [
    "Q23413", // castle
    "Q15848826", // city palace
    "Q53536964", //royal palace
    "Q2116450", // manor estate
    "Q16560", // palace
    "Q3354019", // säteri
    "Q1802963", // herrgård
    "Q879050", //herrgårdshus
    "Q751876", // cheatou (slott)
    "Q2651004", // palazzo
  ],
  library: [
    "Q7075", // library
    "Q28564", // public libr
    "Q856584", // library building
    "Q2326815", // municipal libr
    "Q856234", // academic library
    "Q1438040", // research library
  ],
  lighthouse: ["Q39715"],
  museum: [
    "Q33506", // museum
    "Q24699794", // museum building
    "Q207694", // art museum
    "Q3196771", // art museum
    "Q588140", // science museum
    "Q17431399", // national museum
    "Q11606865", // picture book museum
    "Q10624527", // biographical museum
    "Q1970365", // natural history museum
    "Q26944969", // photography museum
    "Q28737012", // museum of culture
    "Q3329412", // archaeology museum
    "Q26959059", // zoological museum
    "Q2327632", // city museum
    "Q866133", // university museum
    "Q58632302", // specialized museum
    "Q957433", // glyptotheque
  ],
  cemetery: [
    "Q39614", // cemetery
    "Q14750991", // Commonwealth War Graves Commission maintained cemetery
    "Q1707610", // war cemetery
  ],
  mosque: [
    "Q32815", // mosque
    "Q1454820", // congregational mosque
    "Q96382832", // destroyed mosque
  ],
};
