// ================================================================
// CONSTRUCTION INNOVATION PLATFORM — DATA LAYER v2026.3
// Per-Project data store — each project has its own isolated data
// Admin: Engr. Saqib Hussain (PE)
// ================================================================
'use strict';
const PLATFORM={name:'Construction Innovation',version:'2026.3',admin:'Engr. Saqib Hussain (PE)',adminTitle:'Lead Electrical Engineer',company:'Construction Innovation'};

// LOCAL DRIVE PATHS – Construction Innovation project folders on D:\
const LOCAL_DRIVE={
  root:      'file:///D:/Construction%20Innovation/Projects/',
  drawings:  'file:///D:/Construction%20Innovation/Projects/Drawings/',
  materials: 'file:///D:/Construction%20Innovation/Projects/Materials/',
  methods:   'file:///D:/Construction%20Innovation/Projects/Methods/',
  testing:   'file:///D:/Construction%20Innovation/Projects/Testing/',
  ncr:       'file:///D:/Construction%20Innovation/Projects/NCR/',
  rfi:       'file:///D:/Construction%20Innovation/Projects/RFI/',
  si:        'file:///D:/Construction%20Innovation/Projects/SI/',
  hse:       'file:///D:/Construction%20Innovation/Projects/HSE/',
  procurement:'file:///D:/Construction%20Innovation/Projects/Procurement/',
  subcontractors:'file:///D:/Construction%20Innovation/Projects/Subcontractors/',
  closeout:  'file:///D:/Construction%20Innovation/Projects/Closeout/',
  progress:  'file:///D:/Construction%20Innovation/Projects/Progress/'
};

function openLocalFile(folder,filename){const path=(LOCAL_DRIVE[folder]||'')+encodeURIComponent(filename);window.open(path,'_blank');}

// ── PROJECT LIST ──────────────────────────────────────────────
let PROJECTS=[
  {id:'PRJ-001',name:'NEXUS TOWER — Mixed Use Development',code:'NXT-2026',client:'Apex Development Holdings',contractor:'BuildCore International LLC',consultant:'Meridian Engineering Group',location:'Downtown Financial District, Tower Block 7',startDate:'2025-01-15',plannedEnd:'2027-06-30',contractValue:185000000,currency:'SAR',currentProgress:34,status:'active',description:'55-storey mixed-use tower including commercial, residential and hospitality floors.'},
  {id:'PRJ-002',name:'HARBOR BRIDGE EXPANSION',code:'HBE-2025',client:'City Infrastructure Authority',contractor:'BuildCore International LLC',consultant:'CivilPro Group',location:'Harbor District, Zone 4',startDate:'2024-06-01',plannedEnd:'2026-12-31',contractValue:42000000,currency:'SAR',currentProgress:68,status:'active',description:'4-lane bridge expansion with pedestrian walkways and cycling infrastructure.'}
];

let ACTIVE_PROJECT = PROJECTS[0];

const USERS=[{id:'U001',name:'Engr. Saqib Hussain (PE)',role:'admin',avatar:'SH',dept:'Lead Electrical Engineer'},{id:'U002',name:'Sarah Chen',role:'engineer',avatar:'SC',dept:'Structural'},{id:'U003',name:'James Okafor',role:'engineer',avatar:'JO',dept:'MEP'},{id:'U004',name:'Priya Sharma',role:'consultant',avatar:'PS',dept:'Design'},{id:'U005',name:'David Williams',role:'engineer',avatar:'DW',dept:'Civil'}];
const DISCIPLINES=['Civil','Structural','Architect','Landscape','Mechanical','Electrical','Plumbing','HVAC','Fire Protection','ELV / IT','Geotechnical'];
const NOTIFICATIONS=[{id:1,type:'warning',text:'3 drawings pending consultant approval',time:'10 min ago',read:false},{id:2,type:'danger',text:'NCR-003 is critical – action required',time:'1 hr ago',read:false},{id:3,type:'info',text:'Weekly progress report due today',time:'2 hrs ago',read:false},{id:4,type:'success',text:'PO-006 fully delivered and accepted',time:'Yesterday',read:true},{id:5,type:'warning',text:'HSE Incident HSE-003 still open',time:'2 days ago',read:true}];

// ── EMPTY PROJECT DATA TEMPLATE ───────────────────────────────
function createEmptyProjectData(projectId) {
  return {
    projectId,
    drawings:    [],
    materials:   [],
    methods:     [],
    ncr:         [],
    rfi:         [],
    si:          [],
    testing:     [],
    procurement: [],
    hse:         { incidents: [], stats: { lti:0, nearMiss:0, toolboxTalks:0, safeManHours:0, ltir:0 } },
    subcontractors: [],
    cost:        { budget:0, revisedBudget:0, committedCost:0, actualCost:0, forecastFinalCost:0, costVariance:0, categories:[] },
    manpower:    { today:{ date: new Date().toISOString().split('T')[0], totalWorkers:0, skilled:0, unskilled:0, staff:0 }, weekly:[], equipment:[] },
    closeout:    [],
    progress:    {
      milestones: [],
      sCurveData: [],
      disciplineProgress: []
    }
  };
}

// ── NORMALIZE PROJECT DATA (fills missing fields for projects loaded from old storage) ──
function normalizeProjectData(pd) {
  if (!pd) return createEmptyProjectData('unknown');
  if (!pd.hse)           pd.hse         = { incidents:[], stats:{lti:0,nearMiss:0,toolboxTalks:0,safeManHours:0,ltir:0} };
  if (!pd.hse.incidents) pd.hse.incidents = [];
  if (!pd.hse.stats)     pd.hse.stats    = {lti:0,nearMiss:0,toolboxTalks:0,safeManHours:0,ltir:0};
  if (!pd.drawings)      pd.drawings     = [];
  if (!pd.materials)     pd.materials    = [];
  if (!pd.methods)       pd.methods      = [];
  if (!pd.ncr)           pd.ncr          = [];
  if (!pd.rfi)           pd.rfi          = [];
  if (!pd.si)            pd.si           = [];
  if (!pd.testing)       pd.testing      = [];
  if (!pd.procurement)   pd.procurement  = [];
  if (!pd.subcontractors)pd.subcontractors = [];
  if (!pd.closeout)      pd.closeout     = [];
  if (!pd.cost)          pd.cost         = {budget:0,revisedBudget:0,committedCost:0,actualCost:0,forecastFinalCost:0,costVariance:0,categories:[]};
  if (!pd.cost.categories) pd.cost.categories = [];
  if (!pd.manpower)      pd.manpower     = {today:{date:new Date().toISOString().split('T')[0],totalWorkers:0,skilled:0,unskilled:0,staff:0},weekly:[],equipment:[]};
  if (!pd.manpower.today)   pd.manpower.today   = {date:new Date().toISOString().split('T')[0],totalWorkers:0,skilled:0,unskilled:0,staff:0};
  if (!pd.manpower.weekly)  pd.manpower.weekly  = [];
  if (!pd.manpower.equipment) pd.manpower.equipment = [];
  if (!pd.progress)      pd.progress     = {milestones:[],sCurveData:[],disciplineProgress:[]};
  if (!pd.progress.milestones)         pd.progress.milestones         = [];
  if (!pd.progress.sCurveData)         pd.progress.sCurveData         = [];
  if (!pd.progress.disciplineProgress) pd.progress.disciplineProgress = [];
  return pd;
}


function createPRJ001Data() {
  return {
    projectId: 'PRJ-001',
    drawings: [
      {id:'DWG-001',title:'Foundation Layout Plan',discipline:'Civil',rev:1,status:'approved',submittedBy:'U005',date:'2025-11-01',consultant:'Meridian',file:'FDN-LP-001-Rev1.pdf',comments:'Approved with minor notes'},
      {id:'DWG-002',title:'Structural Frame – Level 3',discipline:'Structural',rev:2,status:'under-review',submittedBy:'U002',date:'2025-12-10',consultant:'Meridian',file:'STR-L3-002-Rev2.pdf',comments:'Pending consultant review'},
      {id:'DWG-003',title:'HVAC Ductwork – Floors 5-8',discipline:'HVAC',rev:1,status:'submitted',submittedBy:'U003',date:'2026-01-05',consultant:'TechSpec',file:'MEP-HVAC-003-Rev1.pdf',comments:''},
      {id:'DWG-004',title:'Facade Cladding Details',discipline:'Architect',rev:4,status:'approved',submittedBy:'U004',date:'2025-10-20',consultant:'Meridian',file:'ARC-FAC-004-Rev4.pdf',comments:'Final approval granted'},
      {id:'DWG-005',title:'Underground Drainage Plan',discipline:'Civil',rev:1,status:'rejected',submittedBy:'U005',date:'2026-01-15',consultant:'Meridian',file:'CIV-DRN-005-Rev1.pdf',comments:'Revise pipe sizes'},
      {id:'DWG-006',title:'Electrical Single Line Diagram',discipline:'Electrical',rev:2,status:'approved',submittedBy:'U003',date:'2025-12-01',consultant:'TechSpec',file:'MEP-ELE-006-Rev2.pdf',comments:'Approved'},
      {id:'DWG-007',title:'Core Wall Reinforcement',discipline:'Structural',rev:3,status:'under-review',submittedBy:'U002',date:'2026-01-20',consultant:'Meridian',file:'STR-COR-007-Rev3.pdf',comments:'In progress'},
      {id:'DWG-008',title:'Plumbing Risers – Typical Floor',discipline:'Plumbing',rev:1,status:'submitted',submittedBy:'U003',date:'2026-02-01',consultant:'TechSpec',file:'MEP-PLB-008-Rev1.pdf',comments:''},
      {id:'DWG-009',title:'Mechanical Plant Room Layout',discipline:'Mechanical',rev:1,status:'submitted',submittedBy:'U003',date:'2026-02-05',consultant:'TechSpec',file:'MEP-MCH-009-Rev1.pdf',comments:''},
      {id:'DWG-010',title:'Fire Suppression – Typical Floor',discipline:'Fire Protection',rev:2,status:'approved',submittedBy:'U003',date:'2026-01-28',consultant:'FireSafe',file:'FPS-TYP-010-Rev2.pdf',comments:'Approved'}
    ],
    materials: [
      {id:'MAT-001',item:'High-Strength Concrete C50',boqRef:'BOQ-3.1.1',poNo:'PO-002',supplier:'MixPro Ready',rev:1,status:'approved',submitDate:'2025-10-15',approveDate:'2025-11-01',deliveryDate:'2026-02-20',qty:5200,unit:'m³',remarks:'Approved per ASTM C39'},
      {id:'MAT-002',item:'Rebar Grade 60 – 32mm Dia',boqRef:'BOQ-3.2.4',poNo:'PO-001',supplier:'SteelTech Corp',rev:2,status:'approved',submitDate:'2025-11-10',approveDate:'2025-12-01',deliveryDate:'2026-01-30',qty:850,unit:'MT',remarks:'Mill certs reviewed'},
      {id:'MAT-003',item:'Curtain Wall System CW-7',boqRef:'BOQ-5.1.2',poNo:'PO-003',supplier:'GlazTec Systems',rev:1,status:'under-review',submitDate:'2026-01-05',approveDate:'',deliveryDate:'2026-05-15',qty:2800,unit:'m²',remarks:'Pending thermal test'},
      {id:'MAT-004',item:'HVAC Chiller Units 500RT',boqRef:'BOQ-8.3.1',poNo:'PO-004',supplier:'CoolAir Ltd',rev:1,status:'submitted',submitDate:'2026-01-18',approveDate:'',deliveryDate:'2026-06-01',qty:3,unit:'No.',remarks:'FAT to be witnessed'},
      {id:'MAT-005',item:'Waterproofing Membrane 3mm',boqRef:'BOQ-4.2.1',poNo:'PO-006',supplier:'SealPro',rev:1,status:'approved',submitDate:'2025-12-01',approveDate:'2025-12-20',deliveryDate:'2026-02-01',qty:3200,unit:'m²',remarks:'Third-party tested'},
      {id:'MAT-006',item:'Precast Concrete Panels',boqRef:'BOQ-5.3.3',poNo:'PO-007',supplier:'PrecastMasters',rev:1,status:'rejected',submitDate:'2026-01-10',approveDate:'',deliveryDate:'2026-04-20',qty:420,unit:'panels',remarks:'Resubmit with fire rating cert'},
      {id:'MAT-007',item:'Structural Steel I-Beams W14',boqRef:'BOQ-3.3.1',poNo:'PO-001',supplier:'SteelTech Corp',rev:3,status:'approved',submitDate:'2025-10-20',approveDate:'2025-11-15',deliveryDate:'2026-01-15',qty:320,unit:'MT',remarks:'Approved Rev 3 after weld test'}
    ],
    methods: [
      {id:'MS-001',title:'Deep Foundation Piling Works',category:'Structural',risk:'High',rev:2,status:'approved',submittedBy:'U002',date:'2025-09-15',hseReview:'Approved',file:'MS-001-Rev2.pdf'},
      {id:'MS-002',title:'Concrete Pour – Transfer Slab',category:'Structural',risk:'High',rev:1,status:'approved',submittedBy:'U002',date:'2025-11-20',hseReview:'Approved',file:'MS-002-Rev1.pdf'},
      {id:'MS-003',title:'Crane Erection & Operation',category:'Lifting',risk:'Critical',rev:1,status:'under-review',submittedBy:'U005',date:'2026-01-10',hseReview:'Pending',file:'MS-003-Rev1.pdf'},
      {id:'MS-004',title:'Facade Installation Procedure',category:'Finishing',risk:'Medium',rev:1,status:'submitted',submittedBy:'U004',date:'2026-01-25',hseReview:'Pending',file:'MS-004-Rev1.pdf'},
      {id:'MS-005',title:'Hot Works – Welding Procedure',category:'MEP',risk:'High',rev:3,status:'approved',submittedBy:'U003',date:'2025-12-10',hseReview:'Approved',file:'MS-005-Rev3.pdf'},
      {id:'MS-006',title:'Temporary Works – Shoring',category:'Civil',risk:'Critical',rev:4,status:'approved',submittedBy:'U005',date:'2025-10-05',hseReview:'Approved',file:'MS-006-Rev4.pdf'}
    ],
    ncr: [
      {id:'NCR-001',title:'Concrete Honeycombing – Column C12',raised:'U005',date:'2026-01-08',status:'open',priority:'high',assignedTo:'U002',closureDate:'',file:'NCR-001.pdf',remarks:'Remediation plan required',location:'Level 3 – Col C12'},
      {id:'NCR-002',title:'Wrong Rebar Diameter – Beam B4',raised:'U002',date:'2026-01-18',status:'open',priority:'critical',assignedTo:'U002',closureDate:'',file:'NCR-002.pdf',remarks:'Remove and replace',location:'Level 4 – Beam B4'},
      {id:'NCR-003',title:'Improper Curing – Podium Slab',raised:'U001',date:'2026-01-20',status:'open',priority:'critical',assignedTo:'U002',closureDate:'',file:'NCR-003.pdf',remarks:'Core sample to be taken',location:'Podium Level'},
      {id:'NCR-004',title:'Missing Fire Stopping at Penetrations',raised:'U003',date:'2026-01-25',status:'closed',priority:'medium',assignedTo:'U003',closureDate:'2026-02-05',file:'NCR-004.pdf',remarks:'Rectified and approved',location:'Level 2 MEP'}
    ],
    rfi: [
      {id:'RFI-001',title:'Clarification on Rebar Splice Length',raised:'U002',date:'2026-01-12',status:'closed',priority:'medium',assignedTo:'U004',closureDate:'2026-01-20',file:'RFI-001.pdf',remarks:'Splice 60D per ACI 318',discipline:'Structural'},
      {id:'RFI-002',title:'Sprinkler Layout Conflict with Beam',raised:'U003',date:'2026-01-18',status:'open',priority:'medium',assignedTo:'U004',closureDate:'',file:'RFI-002.pdf',remarks:'Awaiting coord drawing',discipline:'Fire Protection'},
      {id:'RFI-003',title:'Electrical Load Schedule Discrepancy',raised:'U003',date:'2026-01-22',status:'open',priority:'high',assignedTo:'U004',closureDate:'',file:'RFI-003.pdf',remarks:'Check transformer sizing',discipline:'Electrical'},
      {id:'RFI-004',title:'Drainage Gradient at Podium Level',raised:'U005',date:'2026-02-01',status:'closed',priority:'low',assignedTo:'U004',closureDate:'2026-02-10',file:'RFI-004.pdf',remarks:'Min 1:100 confirmed',discipline:'Civil'}
    ],
    si: [
      {id:'SI-001',title:'Increase Slab Thickness FL4 from 200 to 250mm',issuedBy:'U004',date:'2026-01-15',status:'open',priority:'high',file:'SI-001.pdf',costImpact:'SAR 42,000',remarks:'Design change approved by client',ref:'SKT-041'},
      {id:'SI-002',title:'Revise Drainage Gradient at Ground Level',issuedBy:'U004',date:'2026-01-22',status:'closed',priority:'low',file:'SI-002.pdf',costImpact:'SAR 8,500',remarks:'Completed and signed off',ref:'SKT-042'},
      {id:'SI-003',title:'Add Expansion Joint at Grid Line H',issuedBy:'U004',date:'2026-02-05',status:'open',priority:'medium',file:'SI-003.pdf',costImpact:'TBD',remarks:'Structural design in progress',ref:'SKT-043'}
    ],
    testing: [
      {id:'TC-001',system:'Pile Load Test – TP01',type:'Structural',date:'2025-08-20',rev:1,status:'passed',cert:'PLC-001',file:'TC-001-Rev1.pdf',remarks:'Load 2x design load'},
      {id:'TC-002',system:'Concrete Cube Test Batch 12',type:'Material',date:'2025-12-15',rev:1,status:'passed',cert:'CCT-012',file:'TC-002-Rev1.pdf',remarks:'Avg 54.2 MPa at 28 days'},
      {id:'TC-003',system:'Waterproofing Test – B2 Slab',type:'Civil',date:'2026-01-10',rev:1,status:'failed',cert:'',file:'TC-003-Rev1.pdf',remarks:'Water infiltration detected'},
      {id:'TC-004',system:'Fire Alarm Loop Test – Phase 1',type:'MEP',date:'2026-01-28',rev:1,status:'pending',cert:'',file:'',remarks:'Scheduled'},
      {id:'TC-005',system:'CCTV System Commissioning',type:'ELV',date:'2026-02-10',rev:1,status:'pending',cert:'',file:'',remarks:'FAT planned'},
      {id:'TC-006',system:'Pump Test – Fire Suppression',type:'MEP',date:'2026-02-05',rev:2,status:'passed',cert:'FPS-006',file:'TC-006-Rev2.pdf',remarks:'Flow rates within spec'}
    ],
    procurement: [
      {id:'PO-001',item:'Structural Steel Package',vendor:'SteelTech Corp',poValue:4200000,status:'delivered',poDate:'2025-09-01',deliveryDate:'2026-01-15',payStatus:'75% paid',performance:88,remarks:'Final payment pending'},
      {id:'PO-002',item:'Ready Mix Concrete Supply',vendor:'MixPro Ready',poValue:2800000,status:'active',poDate:'2025-10-15',deliveryDate:'2026-12-01',payStatus:'40% paid',performance:92,remarks:'Ongoing supply'},
      {id:'PO-003',item:'Curtain Wall System',vendor:'GlazTec Systems',poValue:7500000,status:'pending',poDate:'2026-01-10',deliveryDate:'2026-05-20',payStatus:'10% paid',performance:0,remarks:'Material approval pending'},
      {id:'PO-004',item:'HVAC Equipment Package',vendor:'CoolAir Ltd',poValue:3200000,status:'partially-delivered',poDate:'2025-12-01',deliveryDate:'2026-06-01',payStatus:'30% paid',performance:78,remarks:'Chiller units delayed'},
      {id:'PO-005',item:'Elevator Systems – 8 Lifts',vendor:'LiftTech Pro',poValue:1800000,status:'pending',poDate:'2026-01-20',deliveryDate:'2026-08-01',payStatus:'5% paid',performance:0,remarks:'24-week lead time'},
      {id:'PO-006',item:'Waterproofing Materials',vendor:'SealPro',poValue:450000,status:'delivered',poDate:'2025-11-20',deliveryDate:'2026-01-30',payStatus:'100% paid',performance:95,remarks:'Fully complete'}
    ],
    hse: {
      incidents:[
        {id:'HSE-001',type:'near-miss',desc:'Worker nearly struck by falling tool from scaffold',date:'2026-01-05',severity:'low',status:'closed',casualties:0,location:'Level 3 Scaffold',rootCause:'Unsecured tool bag',correctiveAction:'Toolbag inspection protocol issued',investigator:'U001'},
        {id:'HSE-002',type:'incident',desc:'Minor hand laceration – grinder without guard',date:'2026-01-12',severity:'medium',status:'closed',casualties:1,location:'Fab Workshop',rootCause:'PPE non-compliance',correctiveAction:'Re-training conducted',investigator:'U001'},
        {id:'HSE-003',type:'near-miss',desc:'Crane load swing towards personnel exclusion zone',date:'2026-01-19',severity:'high',status:'open',casualties:0,location:'Zone B – TC-2',rootCause:'Under investigation',correctiveAction:'Crane ops suspended pending review',investigator:'U001'},
        {id:'HSE-004',type:'incident',desc:'Slip on wet concrete – ankle sprain',date:'2026-02-02',severity:'medium',status:'open',casualties:1,location:'Level 2 Podium',rootCause:'Inadequate signage',correctiveAction:'Barriers and signage installed',investigator:'U001'}
      ],
      stats:{lti:1,nearMiss:15,toolboxTalks:48,safeManHours:284000,ltir:0.35}
    },
    subcontractors: [
      {id:'SC-001',name:'AlphaFoundation Works',scope:'Piling & Foundations',status:'completed',workers:0,contractValue:3800000,paidToDate:3800000,performance:89,safety:95,poRef:'PO-008',contactPerson:'Ahmed Al-Rashid',phone:'+1-555-0101',startDate:'2025-01-15',endDate:'2025-09-10'},
      {id:'SC-002',name:'SteelFrame Masters',scope:'Structural Steelwork',status:'active',workers:68,contractValue:8200000,paidToDate:4500000,performance:84,safety:88,poRef:'PO-001',contactPerson:'Carlos Mendez',phone:'+1-555-0102',startDate:'2025-08-01',endDate:'2026-06-30'},
      {id:'SC-003',name:'ProConcrete Solutions',scope:'In-situ Concrete',status:'active',workers:124,contractValue:5600000,paidToDate:2800000,performance:78,safety:82,poRef:'PO-002',contactPerson:'Wei Zhang',phone:'+1-555-0103',startDate:'2025-09-01',endDate:'2026-09-30'},
      {id:'SC-004',name:'MEP Systems Group',scope:'Mechanical & Electrical',status:'active',workers:45,contractValue:12500000,paidToDate:1800000,performance:91,safety:94,poRef:'PO-004',contactPerson:'Raj Patel',phone:'+1-555-0104',startDate:'2025-11-01',endDate:'2027-03-31'},
      {id:'SC-005',name:'FacadePro International',scope:'Curtain Wall & Glazing',status:'mobilizing',workers:12,contractValue:7200000,paidToDate:360000,performance:0,safety:0,poRef:'PO-003',contactPerson:'Lena Müller',phone:'+1-555-0105',startDate:'2026-02-15',endDate:'2026-12-31'},
      {id:'SC-006',name:'FinishLine Interiors',scope:'Fit-out & Finishes',status:'not-started',workers:0,contractValue:9800000,paidToDate:0,performance:0,safety:0,poRef:'TBD',contactPerson:'Fatima Hassan',phone:'+1-555-0106',startDate:'2026-09-01',endDate:'2027-05-31'}
    ],
    cost: {budget:188200000,revisedBudget:188200000,committedCost:98400000,actualCost:67200000,forecastFinalCost:192500000,costVariance:-4300000,categories:[{name:'Preliminaries',budget:12000000,committed:11800000,actual:9200000,forecast:12400000},{name:'Structural Works',budget:45000000,committed:38000000,actual:29000000,forecast:46200000},{name:'MEP Systems',budget:38000000,committed:22000000,actual:12000000,forecast:40500000},{name:'Architectural',budget:32000000,committed:15000000,actual:8500000,forecast:33800000},{name:'External Works',budget:18000000,committed:8000000,actual:4200000,forecast:17600000},{name:'Contingency',budget:12000000,committed:3600000,actual:2300000,forecast:8000000},{name:'Variations',budget:3200000,committed:3200000,actual:2000000,forecast:3200000}]},
    manpower: {today:{date:'2026-02-17',totalWorkers:412,skilled:168,unskilled:212,staff:32},weekly:[{week:'Week 1',target:380,actual:362,skilled:145,unskilled:190,staff:27},{week:'Week 2',target:390,actual:378,skilled:150,unskilled:198,staff:30},{week:'Week 3',target:400,actual:391,skilled:158,unskilled:203,staff:30},{week:'Week 4',target:420,actual:408,skilled:165,unskilled:212,staff:31},{week:'Week 5',target:430,actual:412,skilled:168,unskilled:212,staff:32},{week:'Week 6',target:450,actual:null,skilled:null,unskilled:null,staff:null}],equipment:[{id:'EQ-001',type:'Tower Crane TC-1',status:'active',utilization:78,operator:'R. Hassan',location:'Zone A'},{id:'EQ-002',type:'Tower Crane TC-2',status:'active',utilization:65,operator:'M. Santos',location:'Zone B'},{id:'EQ-003',type:'Concrete Pump 52m',status:'active',utilization:55,operator:'J. Kim',location:'Level 3'},{id:'EQ-004',type:'Mobile Crane 100T',status:'standby',utilization:20,operator:'—',location:'Yard'},{id:'EQ-005',type:'Excavator CAT 330',status:'active',utilization:88,operator:'D. Osei',location:'Basement'},{id:'EQ-006',type:'Batching Plant 60m³',status:'active',utilization:70,operator:'A. Farida',location:'Site Office'},{id:'EQ-007',type:'Personnel Hoist PH-1',status:'active',utilization:90,operator:'Automated',location:'North Core'},{id:'EQ-008',type:'Personnel Hoist PH-2',status:'maintenance',utilization:0,operator:'—',location:'South Core'}]},
    closeout: [
      {id:'CL-001',item:'As-built Drawings – Civil',status:'not-started',due:'2027-05-01',assignedTo:'U005',category:'Documentation',remarks:''},
      {id:'CL-002',item:'As-built Drawings – Structural',status:'not-started',due:'2027-05-01',assignedTo:'U002',category:'Documentation',remarks:''},
      {id:'CL-003',item:'O&M Manuals – MEP Systems',status:'in-progress',due:'2027-04-15',assignedTo:'U003',category:'Manuals',remarks:'Draft 1 issued'},
      {id:'CL-004',item:'Fire Safety Certificate',status:'not-started',due:'2027-05-30',assignedTo:'U001',category:'Permits',remarks:''},
      {id:'CL-005',item:'Building Occupancy Permit',status:'not-started',due:'2027-06-15',assignedTo:'U001',category:'Permits',remarks:''},
      {id:'CL-006',item:'Defects Liability Register',status:'not-started',due:'2027-06-30',assignedTo:'U001',category:'Documentation',remarks:''},
      {id:'CL-007',item:'BMS Training Records',status:'in-progress',due:'2027-04-01',assignedTo:'U003',category:'Training',remarks:'Session 1 completed'},
      {id:'CL-008',item:'Spare Parts Handover Schedule',status:'not-started',due:'2027-05-15',assignedTo:'U003',category:'Handover',remarks:''}
    ],
    progress: {
      milestones:[{id:'MS01',name:'Piling Complete',planned:'2025-08-30',actual:'2025-09-10',status:'completed',delay:11},{id:'MS02',name:'Basement Slab – Level B2',planned:'2025-10-15',actual:'2025-10-28',status:'completed',delay:13},{id:'MS03',name:'Ground Floor Slab',planned:'2025-12-20',actual:'2026-01-05',status:'completed',delay:16},{id:'MS04',name:'Structure Complete – L10',planned:'2026-04-30',actual:'',status:'on-track',delay:0},{id:'MS05',name:'Facade Envelope Closed',planned:'2026-08-15',actual:'',status:'at-risk',delay:0},{id:'MS06',name:'MEP Rough-in Complete',planned:'2026-10-30',actual:'',status:'on-track',delay:0},{id:'MS07',name:'Fit-out Complete',planned:'2027-03-15',actual:'',status:'on-track',delay:0},{id:'MS08',name:'Practical Completion',planned:'2027-06-30',actual:'',status:'on-track',delay:0}],
      sCurveData:[{month:'Jan 25',planned:2,actual:1.5},{month:'Feb 25',planned:4,actual:3.2},{month:'Mar 25',planned:7,actual:5.8},{month:'Apr 25',planned:10,actual:8.5},{month:'May 25',planned:14,actual:12},{month:'Jun 25',planned:18,actual:16},{month:'Jul 25',planned:22,actual:20},{month:'Aug 25',planned:26,actual:24},{month:'Sep 25',planned:30,actual:27},{month:'Oct 25',planned:34,actual:30},{month:'Nov 25',planned:38,actual:33},{month:'Dec 25',planned:41,actual:35},{month:'Jan 26',planned:44,actual:36},{month:'Feb 26',planned:48,actual:null}],
      disciplineProgress:[{name:'Structural',progress:48,planned:52},{name:'Civil',progress:72,planned:80},{name:'Mechanical',progress:15,planned:18},{name:'Electrical',progress:20,planned:25},{name:'Plumbing',progress:12,planned:16},{name:'HVAC',progress:18,planned:22},{name:'Architect',progress:12,planned:15},{name:'Landscape',progress:5,planned:8}]
    }
  };
}

// ── SEED DATA FOR PRJ-002 ─────────────────────────────────────
function createPRJ002Data() {
  const e = createEmptyProjectData('PRJ-002');
  e.drawings = [
    {id:'DWG-B01',title:'Bridge Pier Layout Plan',discipline:'Civil',rev:3,status:'approved',submittedBy:'U005',date:'2024-08-10',consultant:'CivilPro',file:'BRG-PIR-001-Rev3.pdf',comments:'Approved final'},
    {id:'DWG-B02',title:'Deck Reinforcement Details',discipline:'Structural',rev:2,status:'approved',submittedBy:'U002',date:'2024-09-15',consultant:'CivilPro',file:'BRG-DRD-002-Rev2.pdf',comments:'Approved'},
    {id:'DWG-B03',title:'Traffic Signal Layout',discipline:'Electrical',rev:1,status:'under-review',submittedBy:'U003',date:'2025-01-10',consultant:'CivilPro',file:'BRG-ELE-003-Rev1.pdf',comments:'Under review'}
  ];
  e.procurement = [
    {id:'PO-B01',item:'Bridge Steel Girders',vendor:'SteelTech Corp',poValue:8500000,status:'delivered',poDate:'2024-07-01',deliveryDate:'2025-03-15',payStatus:'90% paid',performance:92,remarks:'Delivery complete'},
    {id:'PO-B02',item:'Concrete Supply – Piers',vendor:'MixPro Ready',poValue:3200000,status:'delivered',poDate:'2024-08-01',deliveryDate:'2025-06-01',payStatus:'80% paid',performance:88,remarks:'Ongoing supply'}
  ];
  e.hse.stats = {lti:0,nearMiss:8,toolboxTalks:62,safeManHours:412000,ltir:0};
  e.manpower.today = {date:'2026-02-17',totalWorkers:280,skilled:110,unskilled:155,staff:15};
  e.cost = {budget:42000000,revisedBudget:43500000,committedCost:36000000,actualCost:29000000,forecastFinalCost:44200000,costVariance:-700000,categories:[{name:'Piling & Foundations',budget:8000000,committed:8000000,actual:8000000,forecast:8000000},{name:'Superstructure',budget:18000000,committed:16000000,actual:12000000,forecast:19000000},{name:'Deck & Surfacing',budget:9000000,committed:7000000,actual:5000000,forecast:9500000},{name:'Traffic & Signaling',budget:4000000,committed:2500000,actual:1500000,forecast:4200000},{name:'Preliminaries',budget:3000000,committed:2500000,actual:2500000,forecast:3500000}]};
  e.progress.sCurveData = [{month:'Jun 24',planned:5,actual:4},{month:'Jul 24',planned:10,actual:9},{month:'Aug 24',planned:18,actual:16},{month:'Sep 24',planned:26,actual:24},{month:'Oct 24',planned:34,actual:32},{month:'Nov 24',planned:42,actual:40},{month:'Dec 24',planned:50,actual:48},{month:'Jan 25',planned:56,actual:54},{month:'Feb 25',planned:62,actual:60},{month:'Mar 25',planned:67,actual:65},{month:'Apr 25',planned:72,actual:70},{month:'May 25',planned:75,actual:68},{month:'Jun 25',planned:78,actual:null}];
  e.progress.disciplineProgress = [{name:'Civil',progress:85,planned:88},{name:'Structural',progress:75,planned:78},{name:'Electrical',progress:45,planned:50},{name:'Landscape',progress:20,planned:30}];
  e.progress.milestones = [{id:'BM01',name:'Piling Works Complete',planned:'2024-09-30',actual:'2024-10-05',status:'completed',delay:5},{id:'BM02',name:'All Piers Complete',planned:'2025-01-31',actual:'2025-02-10',status:'completed',delay:10},{id:'BM03',name:'Deck Casting Complete',planned:'2025-06-30',actual:'',status:'on-track',delay:0},{id:'BM04',name:'Surfacing Complete',planned:'2026-03-31',actual:'',status:'at-risk',delay:0},{id:'BM05',name:'Practical Completion',planned:'2026-12-31',actual:'',status:'on-track',delay:0}];
  return e;
}

// ── PROJECT DATA STORE ────────────────────────────────────────
// Maps projectId -> project module data
const PROJECT_STORE = {
  'PRJ-001': createPRJ001Data(),
  'PRJ-002': createPRJ002Data()
};

function getProjectStore(projectId) {
  if (!PROJECT_STORE[projectId]) {
    PROJECT_STORE[projectId] = createEmptyProjectData(projectId);
  }
  return normalizeProjectData(PROJECT_STORE[projectId]);
}

function getPD() {
  return getProjectStore(ACTIVE_PROJECT.id);
}

// ── COMPUTED ACTIVE REFERENCES (proxies to active project data) ─
// These are what app.js uses throughout via window.APP_DATA.mockXxx
// We update them dynamically on project switch
let mockDrawingsData    = getPD().drawings;
let mockMaterialsData   = getPD().materials;
let mockMethodsData     = getPD().methods;
let mockNCRData         = getPD().ncr;
let mockRFIData         = getPD().rfi;
let mockSIData          = getPD().si;
let mockTestingData     = getPD().testing;
let mockProcurementData = getPD().procurement;
let mockHSEData         = getPD().hse;
let mockSubcontractorData = getPD().subcontractors;
let mockCostData        = getPD().cost;
let mockManpowerData    = getPD().manpower;
let mockCloseoutData    = getPD().closeout;
let mockProgressData    = getPD().progress;

// ── SWITCH PROJECT DATA ───────────────────────────────────────
function switchProjectData(projectId) {
  ACTIVE_PROJECT = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const pd = getPD();
  // Re-assign module-level vars AND update APP_DATA references
  mockDrawingsData      = pd.drawings;
  mockMaterialsData     = pd.materials;
  mockMethodsData       = pd.methods;
  mockNCRData           = pd.ncr;
  mockRFIData           = pd.rfi;
  mockSIData            = pd.si;
  mockTestingData       = pd.testing;
  mockProcurementData   = pd.procurement;
  mockHSEData           = pd.hse;
  mockSubcontractorData = pd.subcontractors;
  mockCostData          = pd.cost;
  mockManpowerData      = pd.manpower;
  mockCloseoutData      = pd.closeout;
  mockProgressData      = pd.progress;
  // Sync APP_DATA references
  if (window.APP_DATA) {
    window.APP_DATA.mockDrawingsData      = pd.drawings;
    window.APP_DATA.mockMaterialsData     = pd.materials;
    window.APP_DATA.mockMethodsData       = pd.methods;
    window.APP_DATA.mockNCRData           = pd.ncr;
    window.APP_DATA.mockRFIData           = pd.rfi;
    window.APP_DATA.mockSIData            = pd.si;
    window.APP_DATA.mockTestingData       = pd.testing;
    window.APP_DATA.mockProcurementData   = pd.procurement;
    window.APP_DATA.mockHSEData           = pd.hse;
    window.APP_DATA.mockSubcontractorData = pd.subcontractors;
    window.APP_DATA.mockCostData          = pd.cost;
    window.APP_DATA.mockManpowerData      = pd.manpower;
    window.APP_DATA.mockCloseoutData      = pd.closeout;
    window.APP_DATA.mockProgressData      = pd.progress;
  }
}

// ── KPIs — now per-project ────────────────────────────────────
function computeKPIs() {
  const pd = getPD();
  const drawings = pd.drawings;
  const ncr = pd.ncr;
  const rfi = pd.rfi;
  const si  = pd.si;
  const hse = pd.hse;
  const manpower = pd.manpower;
  const cost = pd.cost;
  const progress = pd.progress;

  // ── Schedule Variance: compute from latest sCurveData entry that has both planned & actual
  let scheduleVariance = 0;
  if (progress.sCurveData && progress.sCurveData.length > 0) {
    // Find most recent data point with actual value
    const withActual = progress.sCurveData.filter(x => x.actual != null);
    if (withActual.length > 0) {
      const latest = withActual[withActual.length - 1];
      scheduleVariance = parseFloat((latest.actual - latest.planned).toFixed(1));
    }
  }

  // ── Planned progress: from latest sCurveData planned value
  let plannedProgress = 0;
  if (progress.sCurveData && progress.sCurveData.length > 0) {
    const lastPlanned = [...progress.sCurveData].reverse().find(x => x.planned != null);
    if (lastPlanned) plannedProgress = lastPlanned.planned;
  }

  // ── Cost Variance: from live category totals (not stale stored fields)
  const liveBudget = cost.categories.length > 0
    ? cost.categories.reduce((a,c)=>a+c.budget,0)
    : cost.revisedBudget || 0;
  const liveForecast = cost.categories.length > 0
    ? cost.categories.reduce((a,c)=>a+c.forecast,0)
    : cost.forecastFinalCost || 0;
  const costVariance = liveBudget > 0
    ? parseFloat(((liveForecast - liveBudget) / liveBudget * 100).toFixed(1))
    : 0;

  return {
    drawingsPending:  drawings.filter(d=>d.status==='submitted'||d.status==='under-review').length,
    drawingsApproved: drawings.filter(d=>d.status==='approved').length,
    drawingsTotal:    drawings.length,
    materialsPending: pd.materials.filter(m=>m.status!=='approved').length,
    openNCRs:  ncr.filter(n=>n.status==='open').length,
    openRFIs:  rfi.filter(r=>r.status==='open').length,
    openSIs:   si.filter(s=>s.status==='open').length,
    scheduleVariance,
    costVariance,
    overallProgress:  ACTIVE_PROJECT.currentProgress,
    plannedProgress,
    activeWorkers:    manpower.today.totalWorkers,
    openIncidents:    hse.incidents.filter(i=>i.status==='open').length,
    safeManHours:     (hse.stats && hse.stats.safeManHours) || 0,
    ltir:             (hse.stats && hse.stats.ltir)         || 0
  };
}

// ── NAV BADGE UPDATER ─────────────────────────────────────────
function updateNavBadges() {
  const pd = getPD();
  const drawingsPending = pd.drawings.filter(d=>d.status==='submitted'||d.status==='under-review').length;
  const ncrRfiSiOpen = pd.ncr.filter(n=>n.status==='open').length + pd.rfi.filter(r=>r.status==='open').length + pd.si.filter(s=>s.status==='open').length;
  const hseOpen = pd.hse.incidents.filter(i=>i.status==='open').length;
  const el1 = document.getElementById('nav-badge-drawings');
  const el2 = document.getElementById('nav-badge-ncr');
  const el3 = document.getElementById('nav-badge-hse');
  if (el1) el1.textContent = drawingsPending || '';
  if (el2) el2.textContent = ncrRfiSiOpen || '';
  if (el3) el3.textContent = hseOpen || '';
}

// ── PERSIST ───────────────────────────────────────────────────
const PROJECT_STORAGE_KEY = 'ci_project_data_v5'; // v5: HSE performance panel dynamic, cost hero IDs added

function saveProjectData() {
  try {
    const snapshot = {
      version: '2026.3',
      savedAt: new Date().toISOString(),
      PROJECTS,
      activeProjectId: ACTIVE_PROJECT.id,
      PROJECT_STORE
    };
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch(e) { console.error('saveProjectData:', e); return false; }
}

function exportProjectData() {
  const snapshot = {
    version: '2026.3',
    savedAt: new Date().toISOString(),
    PROJECTS,
    activeProjectId: ACTIVE_PROJECT.id,
    PROJECT_STORE
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CI-ProjectData-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importProjectData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.PROJECTS) throw new Error('Invalid project data file');
        PROJECTS.length = 0;
        data.PROJECTS.forEach(p => PROJECTS.push(p));
        if (data.PROJECT_STORE) {
          Object.keys(data.PROJECT_STORE).forEach(k => { PROJECT_STORE[k] = data.PROJECT_STORE[k]; });
        }
        const ap = PROJECTS.find(p => p.id === data.activeProjectId) || PROJECTS[0];
        switchProjectData(ap.id);
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(data));
        resolve(data);
      } catch(err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}

function loadProjectDataFromStorage() {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.PROJECTS) return false;
    PROJECTS.length = 0;
    data.PROJECTS.forEach(p => PROJECTS.push(p));
    if (data.PROJECT_STORE) {
      Object.keys(data.PROJECT_STORE).forEach(k => {
        PROJECT_STORE[k] = normalizeProjectData(data.PROJECT_STORE[k]);
      });
    }
    const ap = PROJECTS.find(p => p.id === data.activeProjectId) || PROJECTS[0];
    ACTIVE_PROJECT = ap;
    // Re-assign the module-level vars from the now-active project
    const pd = getPD();
    mockDrawingsData      = pd.drawings;
    mockMaterialsData     = pd.materials;
    mockMethodsData       = pd.methods;
    mockNCRData           = pd.ncr;
    mockRFIData           = pd.rfi;
    mockSIData            = pd.si;
    mockTestingData       = pd.testing;
    mockProcurementData   = pd.procurement;
    mockHSEData           = pd.hse;
    mockSubcontractorData = pd.subcontractors;
    mockCostData          = pd.cost;
    mockManpowerData      = pd.manpower;
    mockCloseoutData      = pd.closeout;
    mockProgressData      = pd.progress;
    return true;
  } catch(e) { console.error('loadProjectDataFromStorage:', e); return false; }
}

// Auto-load from localStorage on script parse
loadProjectDataFromStorage();

// ── ENTRY STORAGE ─────────────────────────────────────────────
const ENTRIES_KEY = 'myEntries';
function loadEntries(){try{const r=localStorage.getItem(ENTRIES_KEY);return r?JSON.parse(r):[]}catch(e){return[];}}
function saveEntries(e){try{localStorage.setItem(ENTRIES_KEY,JSON.stringify(e));return true;}catch(e){return false;}}
function exportEntries(){const b=new Blob([JSON.stringify(loadEntries(),null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='entries-backup.json';a.click();URL.revokeObjectURL(u);}
function importEntries(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!Array.isArray(d))throw new Error('Expected array');saveEntries(d);res(d);}catch(err){rej(err);}};r.onerror=()=>rej(new Error('Read failed'));r.readAsText(file);});}

function exportToCSV(data,filename){if(!data||!data.length)return;const h=Object.keys(data[0]).join(',');const rows=data.map(row=>Object.values(row).map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','));const csv=[h,...rows].join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename+'.csv';a.click();URL.revokeObjectURL(url);}

window.APP_DATA = {
  PLATFORM,
  PROJECTS,
  get ACTIVE_PROJECT() { return ACTIVE_PROJECT; },
  set ACTIVE_PROJECT(v) { ACTIVE_PROJECT = v; },
  USERS, NOTIFICATIONS, DISCIPLINES, LOCAL_DRIVE, openLocalFile,
  // Module data — these point to the active project's arrays
  get mockDrawingsData()      { return getPD().drawings; },
  get mockMaterialsData()     { return getPD().materials; },
  get mockMethodsData()       { return getPD().methods; },
  get mockNCRData()           { return getPD().ncr; },
  get mockRFIData()           { return getPD().rfi; },
  get mockSIData()            { return getPD().si; },
  get mockTestingData()       { return getPD().testing; },
  get mockProcurementData()   { return getPD().procurement; },
  get mockHSEData()           { return getPD().hse; },
  get mockSubcontractorData() { return getPD().subcontractors; },
  get mockCostData()          { return getPD().cost; },
  get mockManpowerData()      { return getPD().manpower; },
  get mockCloseoutData()      { return getPD().closeout; },
  get mockProgressData()      { return getPD().progress; },
  // Functions
  computeKPIs, exportToCSV, switchProjectData, getProjectStore, getPD, updateNavBadges,
  saveProjectData, exportProjectData, importProjectData,
  loadEntries, saveEntries, exportEntries, importEntries
};
