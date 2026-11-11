/* ============================================================
   CAFE ATLAS v3 — demo dataset (all India)
   Fictional demo records. Coordinates are approximate.
   ============================================================ */
const CATS = {
  cafe:       {color:'#183D32', price:[150,600], suffix:['Coffee Works','Roastery','Espresso Bar','Café'], cuisines:['Coffee & Bakes','Continental','Desserts']},
  restaurant: {color:'#4A3028', price:[250,900], suffix:['Kitchen','Bistro','Thali House','Dining'], cuisines:['North Indian','Chinese','Continental','Konkan','Multi-cuisine']},
  street:     {color:'#C58B52', price:[40,150],  suffix:['Vada Stall','Pav Corner','Chaat Cart','Bhurji Point'], cuisines:['Vada Pav','Pav Bhaji','Chaat','Kathi Roll']}
};
const PREFIX = ['Amber','Copper','Sage','Harbour','Monsoon','Kettle','Maple','Cinder','Saffron','Juniper','Ember','Lantern'];
const PER_PAGE = 10;

const CITY_DEFS = [
  {key:'mumbai', name:'Mumbai', zones:[
    {name:'South Mumbai',locs:[['Churchgate',18.9322,72.8264],['Marine Lines',18.9435,72.8232],['Charni Road',18.9520,72.8190]]},
    {name:'Central Mumbai',locs:[['Grant Road',18.9644,72.8170],['Mumbai Central',18.9710,72.8195],['Mahalaxmi',18.9830,72.8230],['Lower Parel',18.9975,72.8290],['Prabhadevi',19.0130,72.8290]]},
    {name:'Dadar and Mahim',locs:[['Dadar',19.0178,72.8478],['Matunga',19.0270,72.8570],['Mahim',19.0410,72.8410]]},
    {name:'Bandra and Khar',locs:[['Bandra',19.0596,72.8295],['Khar Road',19.0700,72.8370]]},
    {name:'Santacruz and Vile Parle',locs:[['Santacruz',19.0820,72.8410],['Vile Parle',19.1000,72.8440]]},
    {name:'Andheri and Jogeshwari',locs:[['Andheri',19.1197,72.8464],['Jogeshwari',19.1360,72.8480]]},
    {name:'Goregaon and Malad',locs:[['Goregaon',19.1640,72.8490],['Malad',19.1870,72.8480]]},
    {name:'Kandivali and Borivali',locs:[['Kandivali',19.2050,72.8520],['Borivali',19.2300,72.8570]]},
    {name:'Dahisar',locs:[['Dahisar',19.2550,72.8560]]},
    {name:'Mira Road and Bhayandar',locs:[['Mira Road',19.2810,72.8680],['Bhayandar',19.3010,72.8500]]},
    {name:'Naigaon and Vasai',locs:[['Naigaon',19.3600,72.8410],['Vasai Road',19.3710,72.8370]]},
    {name:'Nalasopara and Virar',locs:[['Nalasopara',19.4170,72.8190],['Virar',19.4560,72.8110]]}
  ]},
  {key:'pune', name:'Pune', zones:[
    {name:'Pune Central',locs:[['Shivajinagar',18.5308,73.8474],['Deccan Gymkhana',18.5169,73.8413]]},
    {name:'Kothrud and Karve Nagar',locs:[['Kothrud',18.5074,73.8077],['Karve Nagar',18.4907,73.8186]]},
    {name:'Hadapsar and Magarpatta',locs:[['Hadapsar',18.5089,73.9260],['Magarpatta',18.5150,73.9290]]},
    {name:'Viman Nagar and Kharadi',locs:[['Viman Nagar',18.5679,73.9143],['Kharadi',18.5510,73.9410]]}
  ]},
  {key:'thane', name:'Thane', zones:[
    {name:'Thane West',locs:[['Naupada',19.1870,72.9700],['Ghodbunder Road',19.2570,72.9950]]},
    {name:'Thane East',locs:[['Kopri',19.1990,72.9800],['Vartak Nagar',19.1960,72.9720]]},
    {name:'Mulund',locs:[['Mulund West',19.1726,72.9425],['Mulund East',19.1700,72.9580]]}
  ]},
  {key:'navi-mumbai', name:'Navi Mumbai', zones:[
    {name:'Vashi and Sanpada',locs:[['Vashi',19.0771,72.9986],['Sanpada',19.0660,73.0070]]},
    {name:'Nerul and Belapur',locs:[['Nerul',19.0330,73.0170],['Belapur',19.0200,73.0390]]},
    {name:'Kharghar and Panvel',locs:[['Kharghar',19.0470,73.0690],['Panvel',18.9894,73.1175]]}
  ]},
  {key:'delhi', name:'New Delhi', zones:[
    {name:'Connaught Place',locs:[['Connaught Place',28.6315,77.2167],['Janpath',28.6250,77.2190]]},
    {name:'South Delhi',locs:[['Hauz Khas',28.5494,77.2001],['Saket',28.5244,77.2066]]},
    {name:'Karol Bagh and Rajendra Place',locs:[['Karol Bagh',28.6514,77.1907],['Rajendra Place',28.6410,77.1780]]},
    {name:'Dwarka',locs:[['Dwarka Sector 10',28.5823,77.0500],['Dwarka Sector 21',28.5530,77.0580]]}
  ]},
  {key:'bengaluru', name:'Bengaluru', zones:[
    {name:'Central Bengaluru',locs:[['MG Road',12.9756,77.6066],['Brigade Road',12.9719,77.6070]]},
    {name:'Indiranagar and Koramangala',locs:[['Indiranagar',12.9719,77.6412],['Koramangala',12.9352,77.6245]]},
    {name:'Whitefield and Marathahalli',locs:[['Whitefield',12.9698,77.7500],['Marathahalli',12.9591,77.6974]]},
    {name:'Jayanagar and JP Nagar',locs:[['Jayanagar',12.9308,77.5838],['JP Nagar',12.9063,77.5857]]}
  ]},
  {key:'hyderabad', name:'Hyderabad', zones:[
    {name:'Banjara and Jubilee Hills',locs:[['Banjara Hills',17.4156,78.4347],['Jubilee Hills',17.4326,78.4071]]},
    {name:'Hitech City and Madhapur',locs:[['Hitech City',17.4435,78.3772],['Madhapur',17.4483,78.3915]]},
    {name:'Secunderabad',locs:[['Secunderabad',17.4399,78.4983],['Paradise',17.4437,78.4983]]}
  ]},
  {key:'chennai', name:'Chennai', zones:[
    {name:'T. Nagar and Nungambakkam',locs:[['T. Nagar',13.0418,80.2341],['Nungambakkam',13.0604,80.2496]]},
    {name:'Adyar and Besant Nagar',locs:[['Adyar',13.0067,80.2570],['Besant Nagar',13.0003,80.2668]]},
    {name:'Anna Nagar',locs:[['Anna Nagar',13.0850,80.2101],['Kilpauk',13.0840,80.2400]]}
  ]},
  {key:'kolkata', name:'Kolkata', zones:[
    {name:'Park Street and Esplanade',locs:[['Park Street',22.5530,88.3520],['Esplanade',22.5657,88.3500]]},
    {name:'Salt Lake and New Town',locs:[['Salt Lake',22.5800,88.4150],['New Town',22.5830,88.4780]]},
    {name:'Ballygunge',locs:[['Ballygunge',22.5270,88.3650]]}
  ]},
  {key:'ahmedabad', name:'Ahmedabad', zones:[
    {name:'Navrangpura and Ellisbridge',locs:[['Navrangpura',23.0370,72.5610],['Ellisbridge',23.0300,72.5600]]},
    {name:'Satellite and Bodakdev',locs:[['Satellite',23.0250,72.5070],['Bodakdev',23.0400,72.5050]]},
    {name:'Old City',locs:[['Manek Chowk',23.0260,72.5870],['Lal Darwaja',23.0250,72.5880]]}
  ]},
  {key:'jaipur', name:'Jaipur', zones:[
    {name:'Malviya Nagar and Vaishali',locs:[['Malviya Nagar',26.8560,75.8100],['Vaishali Nagar',26.9100,75.7400]]},
    {name:'C-Scheme and Bani Park',locs:[['C-Scheme',26.9120,75.7950],['Bani Park',26.9250,75.8030]]},
    {name:'Old Jaipur',locs:[['Hawa Mahal',26.9239,75.8267],['Johari Bazaar',26.9196,75.8230]]}
  ]}
];

/* ---------- seeded PRNG so the demo data is identical on every load ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R = rng(20261111);
const pick = a => a[Math.floor(R()*a.length)];
const between = (a,b) => a + R()*(b-a);
const clampN = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
const avgArr = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;

const NOW = new Date(2026,10,11);
const BUS = [], REV = [], ZONE_LIST = [];
let bid = 1;

for (const c of CITY_DEFS) for (const z of c.zones) {
  const zid = `${c.key}::${z.name}`;
  ZONE_LIST.push({
    id: zid, city: c.key, cityName: c.name, name: z.name, locCount: z.locs.length,
    lat: avgArr(z.locs.map(l=>l[1])), lng: avgArr(z.locs.map(l=>l[2]))
  });
  for (const [ln, la, lo] of z.locs) {
    const n = 3 + Math.floor(R()*3);
    for (let k=0; k<n; k++) {
      const r = R();
      const cat = r<0.40 ? 'cafe' : r<0.75 ? 'restaurant' : 'street';
      const C = CATS[cat];
      const created = new Date(2025, Math.floor(R()*22), 1+Math.floor(R()*27));
      const price = Math.round(between(C.price[0],C.price[1])/10)*10;
      const quality = between(3.0,4.8);
      BUS.push({
        id: bid, name: `${pick(PREFIX)} ${pick(C.suffix)}`, cat,
        cuisine: pick(C.cuisines), veg: R() < (cat==='street' ? 0.7 : 0.5),
        city: c.key, cityName: c.name, zone: z.name, zid, locality: ln,
        lat: la + (R()-0.5)*0.004, lng: lo + (R()-0.5)*0.004,
        price, created
      });
      const nRev = 4 + Math.floor(R()*18);
      for (let j=0; j<nRev; j++) {
        const d = new Date(created.getTime() + R()*(NOW - created));
        REV.push({bid, rating: clampN(Math.round(quality + (R()-0.5)*1.6),1,5), date: d});
      }
      bid++;
    }
  }
}
