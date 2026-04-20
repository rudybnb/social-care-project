/* ============================================
   Social Care Placement Cost Quote Sheet
   Application Logic
   ============================================ */

// ---- Dropdown Data ----
const STAFFING_TYPES = [
  { value: '', label: 'Select Staffing Type' },
  { value: 'care-contact-supervision', label: 'Care - Contact Supervision', desc: 'Staffing - accompanying young person during face to face contact with parent/significant other' },
  { value: 'care-escort', label: 'Care - Escort', desc: 'Staffing - cost associated with accompanying young person during journey to a specified location' },
  { value: 'care-live-in-staff', label: 'Care - Live in Staff', desc: 'Staffing - where a member of staff resides at the property to support the young person' },
  { value: 'care-staffing-1-1', label: 'Care - Staffing 1:1', desc: 'Staffing - one to one levels of staffing on regular weekly basis; usually day time only' },
  { value: 'care-staffing-2-1', label: 'Care - Staffing 2:1', desc: 'Staffing - two to one levels of staffing on a regular weekly basis; usually day time only' },
  { value: 'care-staffing-other', label: 'Care - Staffing Other', desc: 'Staffing - other staffing needs' },
  { value: 'care-waking-nights', label: 'Care - Waking Nights', desc: 'Staffing - a member of staff who monitors the C/YP throughout the night' },
  { value: 'education-staffing-1-1', label: 'Education - Staffing 1:1', desc: 'Staffing - provision of specialist education staff (e.g. for 1:1 tuition)' },
  { value: 'health-staffing', label: 'Health - Staffing', desc: 'Staffing - provision of specialist health staff (e.g. therapies, treatments)' },
];

const TRANSPORT_TYPES = [
  { value: '', label: 'Select Transport Type' },
  { value: 'care-escorted-transport', label: 'Care - Escorted Transport', desc: 'Transport costs associated with escorting young person to/from various specified locations' },
  { value: 'care-mileage', label: 'Care - Mileage', desc: 'Transport mileage claimed for travel to/from locations specified and agreed between provider and KCC' },
  { value: 'care-public-transport', label: 'Care - Public Transport', desc: 'Transport costs such as train or bus fares for journeys undertaken by placed individual' },
  { value: 'care-taxi', label: 'Care - Taxi', desc: 'Transport taxi fares only for journeys undertaken by child/young person' },
  { value: 'care-transport-other', label: 'Care - Transport Other', desc: 'All other transport costs (such as private minibus, air, ferry etc)' },
];

const OTHER_TYPES = [
  { value: '', label: 'Select Other Type' },
  { value: 'care-additional-service', label: 'Care Additional Service - Other', desc: 'Services other than those specified' },
  { value: 'care-assessments', label: 'Care - Assessments', desc: 'Service to provide written assessments/progress reports within specified parameters' },
  { value: 'care-specialist-equipment', label: 'Care - Specialist Equipment', desc: 'Rental, hire or lease and utilisation of specialist care equipment (including maintenance)' },
  { value: 'care-therapy', label: 'Care - Therapy', desc: 'Provision of therapies to meet agreed requirements of individual (excludes expenses)' },
  { value: 'care-translation-interpreters', label: 'Care - Translation/Interpreters', desc: 'Provision of qualified interpreter/translator, excluding expenses' },
];

const ONEOFF_TYPES = [
  { value: '', label: 'Select One-off Cost' },
  { value: 'care-additional-service', label: 'Care - Additional Service', desc: 'Services other than those specified' },
  { value: 'care-assessment', label: 'Care - Assessment', desc: 'Service to provide written assessment relating to care within specified parameters' },
  { value: 'education-assessment', label: 'Education - Assessment', desc: 'Service to provide written assessment relating to education within specified parameters' },
  { value: 'health-assessment', label: 'Health - Assessment', desc: 'Service to provide written assessment relating to health within specified parameters' },
  { value: 'care-staffing', label: 'Care - Staffing', desc: 'Provision of staff for care purposes on a one-off basis' },
  { value: 'care-contact-supervision', label: 'Care - Contact Supervision', desc: 'Provision of supervised contact on one-off basis' },
  { value: 'education-other', label: 'Education - Other', desc: 'One-off education provision' },
  { value: 'education-staffing', label: 'Education - Staffing', desc: 'One-off education staff provision' },
  { value: 'care-escort', label: 'Care - Escort', desc: 'One-off provision of authorised adult to escort placed individual to specified location' },
  { value: 'care-escorted-transport', label: 'Care - Escorted Transport', desc: 'One-off provision of transport vehicle for an escorted service' },
  { value: 'health-staffing', label: 'Health - Staffing', desc: 'One-off health staff provision' },
  { value: 'care-live-in-staff', label: 'Care - Live-in Staff', desc: 'One-off live in staff provision' },
  { value: 'care-mileage', label: 'Care - Mileage', desc: 'Provision of once-only transport requirement where claim is for mileage only' },
  { value: 'care-public-transport', label: 'Care - Public Transport', desc: 'Cost to cover once-only public transport requirement' },
  { value: 'care-specialist-equipment', label: 'Care - Specialist Equipment', desc: 'One-off charge for purchase of specialist equipment' },
  { value: 'care-staffing-1-1', label: 'Care - Staffing 1:1', desc: 'Once only provision - one to one levels of staffing' },
  { value: 'care-staffing-2-1', label: 'Care - Staffing 2:1', desc: 'Once only provision - two to one levels of staffing' },
  { value: 'care-taxi', label: 'Care - Taxi', desc: 'One-off cost for journey by approved taxi service' },
  { value: 'care-therapy', label: 'Care - Therapy', desc: 'One-off cost for the provision of therapies to meet agreed requirements' },
  { value: 'care-translation-interpreters', label: 'Care - Translation/Interpreters', desc: 'One-off cost for the provision of qualified interpreter/translator, excluding expenses' },
  { value: 'care-transport-other', label: 'Care - Transport Other', desc: 'Once only transport provision excluding taxi and public transport' },
  { value: 'health-other', label: 'Health - Other', desc: 'One-off health provision' },
  { value: 'care-waking-nights', label: 'Care - Waking Nights', desc: 'One-off waking night staff provision' },
];

const UNIT_MEASURES = [
  { value: '', label: 'Select Unit' },
  { value: 'day', label: 'Day', desc: 'Items/services provided on a daily basis (any portion of 24hr period)' },
  { value: 'hour', label: 'Hour', desc: 'Items/services provided on an hourly basis' },
  { value: 'session', label: 'Session', desc: 'Fixed price regardless of duration (typically 3-4 hrs)' },
  { value: 'week', label: 'Week', desc: 'Package that cannot be less than daily, 7 days per week' },
  { value: 'miles', label: 'Miles', desc: 'Transport - where charged by mile' },
  { value: 'kilometres', label: 'Kilometres', desc: 'Transport - where charged by kilometres' },
  { value: 'journey-single', label: 'Journey Single', desc: 'Transport - one way, door to destination journey' },
  { value: 'journey-return', label: 'Journey Return', desc: 'Transport - return journey, door to door' },
];

const PLACEMENT_TYPES = [
  'Residential Family Assessment Unit',
  'Children\'s Home',
  'Semi-Independent Living',
  'Foster Care',
  'Supported Accommodation',
  'Residential School',
  'Secure Unit',
  'Other',
];

const INVOICE_SCHEDULES = ['MONTHLY', 'WEEKLY', 'FORTNIGHTLY', '4-WEEKLY'];

const PRESET_ADDRESSES = [
  { label: 'Select predefined address...', no: '', street: '', town: '', county: '', post: '' },
  { label: '31 St Johns Road, Erith', no: '31', street: 'St Johns Road', town: 'Erith', county: 'Kent', post: 'DA8 1PE' },
  { label: '65 Niclby Close, Thamesmead', no: '65', street: 'Niclby Close', town: 'Thamesmead', county: 'Kent', post: 'SE28 8LY' },
  { label: '25 Breton Road, Rochester', no: '25', street: 'Breton Road', town: 'Rochester', county: 'Kent', post: 'ME1 2JH' },
];

// ---- Configuration ----
const STAFFING_ROWS = 10;
const TRANSPORT_ROWS = 5;
const OTHER_ROWS = 5;
const ONEOFF_ROWS = 8;

// ---- Application State ----
let state = {
  // Provider details
  childInitials: '',
  localAuthority: '',
  quoteStatus: 'Draft Quote',
  date: new Date().toISOString().split('T')[0],
  providerName: 'Eclesia Family Centre',
  headHouseNo: '',
  headStreet: '',
  headTown: '',
  headCounty: '',
  headPostCode: '',
  headTelephone: '',
  headEmail: 'management@eclesia-limited.org',
  unitHouseNo: '',
  unitStreet: '',
  unitTown: '',
  unitCounty: '',
  unitPostCode: '',
  placementType: '',
  invoiceSchedule: 'MONTHLY',

  // Core costs
  coreCosts: {
    carePlacement: { rate: 0, units: 1, discountAmount: 0, discountPercent: 0 },
    careBusiness: { rate: 0, units: 1, discountAmount: 0, discountPercent: 0 },
    careBuilding: { rate: 0, units: 1, discountAmount: 0, discountPercent: 0 },
    education: { rate: 0, units: 1, discountAmount: 0, discountPercent: 0 },
    health: { rate: 0, units: 1, discountAmount: 0, discountPercent: 0 },
  },

  // Weeks
  careWeeks: 12,
  educationWeeks: 0,
  healthWeeks: 0,

  // Additional costs
  staffing: Array.from({ length: STAFFING_ROWS }, () => ({ type: '', unit: '', cost: 0, numUnits: 0, discountAmount: 0, discountPercent: 0 })),
  transport: Array.from({ length: TRANSPORT_ROWS }, () => ({ type: '', unit: '', cost: 0, numUnits: 0, discountAmount: 0, discountPercent: 0 })),
  other: Array.from({ length: OTHER_ROWS }, () => ({ type: '', unit: '', cost: 0, numUnits: 0, discountAmount: 0, discountPercent: 0 })),

  // Retainer
  retainerIndicative: false,
  retainerBeforeDiscount: 0,
  retainerDiscount: 0,

  // One-off costs
  oneoff: Array.from({ length: ONEOFF_ROWS }, () => ({ type: '', price: 0, oneoff: true, discountAmount: 0, discountPercent: 0 })),
};

// ---- Utility Functions ----
function formatCurrency(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
  return '£ ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseNumber(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show', 'success');
  setTimeout(() => toast.classList.remove('show', 'success'), 2500);
}

// ---- Calculation Engine ----
function calculateAll() {
  // Core costs
  const coreResults = {};
  let totalCoreCost = 0;
  let totalCoreNet = 0;

  for (const [key, val] of Object.entries(state.coreCosts)) {
    const costPerWeek = val.rate * val.units;
    const netCost = costPerWeek - val.discountAmount;
    coreResults[key] = { costPerWeek, netCost };
    totalCoreCost += costPerWeek;
    totalCoreNet += netCost;
  }

  // Care sub-total (placement + business + building)
  const careCoreNet = coreResults.carePlacement.netCost + coreResults.careBusiness.netCost + coreResults.careBuilding.netCost;
  const educationCoreNet = coreResults.education.netCost;
  const healthCoreNet = coreResults.health.netCost;

  // Additional staffing
  let totalStaffingCost = 0;
  let totalStaffingNet = 0;
  const staffingResults = state.staffing.map(row => {
    const costPw = row.cost * row.numUnits;
    const net = costPw - row.discountAmount;
    totalStaffingCost += costPw;
    totalStaffingNet += net;
    return { costPw, net };
  });

  // Additional transport
  let totalTransportCost = 0;
  let totalTransportNet = 0;
  const transportResults = state.transport.map(row => {
    const costPw = row.cost * row.numUnits;
    const net = costPw - row.discountAmount;
    totalTransportCost += costPw;
    totalTransportNet += net;
    return { costPw, net };
  });

  // Additional other
  let totalOtherCost = 0;
  let totalOtherNet = 0;
  const otherResults = state.other.map(row => {
    const costPw = row.cost * row.numUnits;
    const net = costPw - row.discountAmount;
    totalOtherCost += costPw;
    totalOtherNet += net;
    return { costPw, net };
  });

  // Total additional
  const totalAdditionalNet = totalStaffingNet + totalTransportNet + totalOtherNet;

  // Summary: categorize additional into Care/Education/Health
  // For simplicity, all additional staffing/transport/other = Care additional
  const careAdditional = totalAdditionalNet;
  const educationAdditional = 0;
  const healthAdditional = 0;

  // Summary rows
  const careTotal = careCoreNet + careAdditional;
  const educationTotal = educationCoreNet + educationAdditional;
  const healthTotal = healthCoreNet + healthAdditional;

  const careCoreGross = coreResults.carePlacement.costPerWeek + coreResults.careBusiness.costPerWeek + coreResults.careBuilding.costPerWeek;
  const educationCoreGross = coreResults.education.costPerWeek;
  const healthCoreGross = coreResults.health.costPerWeek;

  const coreDiscount = totalCoreCost - totalCoreNet;
  const additionalDiscount = (totalStaffingCost - totalStaffingNet) + (totalTransportCost - totalTransportNet) + (totalOtherCost - totalOtherNet);
  const totalDiscount = coreDiscount + additionalDiscount;

  const totalGross = totalCoreCost + totalStaffingCost + totalTransportCost + totalOtherCost;
  const weeklyNetCost = totalCoreNet + totalAdditionalNet;

  // Placement Forecast (annual based on weeks)
  const careForecast = careTotal * state.careWeeks;
  const educationForecast = educationTotal * state.educationWeeks;
  const healthForecast = healthTotal * state.healthWeeks;
  const totalForecast = careForecast + educationForecast + healthForecast;

  // Retainer
  const retainerFinal = state.retainerBeforeDiscount - state.retainerDiscount;

  // One-off costs
  let totalOneoffNet = 0;
  const oneoffResults = state.oneoff.map(row => {
    const net = row.price - row.discountAmount;
    totalOneoffNet += net > 0 ? net : 0;
    return { net: net > 0 ? net : 0 };
  });

  return {
    coreResults,
    totalCoreCost,
    totalCoreNet,
    careCoreNet,
    educationCoreNet,
    healthCoreNet,
    staffingResults,
    totalStaffingCost,
    totalStaffingNet,
    transportResults,
    totalTransportCost,
    totalTransportNet,
    otherResults,
    totalOtherCost,
    totalOtherNet,
    totalAdditionalNet,
    careAdditional,
    educationAdditional,
    healthAdditional,
    careTotal,
    educationTotal,
    healthTotal,
    careCoreGross,
    educationCoreGross,
    healthCoreGross,
    coreDiscount,
    additionalDiscount,
    totalDiscount,
    totalGross,
    weeklyNetCost,
    careForecast,
    educationForecast,
    healthForecast,
    totalForecast,
    retainerFinal,
    oneoffResults,
    totalOneoffNet,
  };
}

// ---- DOM Update Functions ----
function updateDisplay() {
  const calc = calculateAll();

  // Grand total banner
  const grandTotalEl = document.getElementById('grandTotalAmount');
  if (grandTotalEl) grandTotalEl.textContent = formatCurrency(calc.weeklyNetCost).replace('£ ', '');

  // Core costs - computed fields
  updateCoreRow('carePlacement', calc.coreResults.carePlacement);
  updateCoreRow('careBusiness', calc.coreResults.careBusiness);
  updateCoreRow('careBuilding', calc.coreResults.careBuilding);
  updateCoreRow('education', calc.coreResults.education);
  updateCoreRow('health', calc.coreResults.health);

  // Core sub-totals
  setMoney('careCoreSubtotal', calc.careCoreNet);
  setMoney('educationCoreSubtotal', calc.educationCoreNet);
  setMoney('healthCoreSubtotal', calc.healthCoreNet);

  // Weekly core cost total
  setMoney('weeklyCoreTotal', calc.totalCoreCost);
  setMoney('weeklyCoreNetTotal', calc.totalCoreNet);

  // Staffing rows
  for (let i = 0; i < STAFFING_ROWS; i++) {
    setMoney(`staffCostPw_${i}`, calc.staffingResults[i].costPw);
    setMoney(`staffStaffPw_${i}`, calc.staffingResults[i].costPw);
    setMoney(`staffNet_${i}`, calc.staffingResults[i].net);
  }
  setMoney('weeklyStaffingTotal', calc.totalStaffingCost);
  setMoney('weeklyStaffingNetTotal', calc.totalStaffingNet);

  // Transport rows
  for (let i = 0; i < TRANSPORT_ROWS; i++) {
    setMoney(`transCostPw_${i}`, calc.transportResults[i].costPw);
    setMoney(`transTransPw_${i}`, calc.transportResults[i].costPw);
    setMoney(`transNet_${i}`, calc.transportResults[i].net);
  }
  setMoney('weeklyTransportTotal', calc.totalTransportCost);
  setMoney('weeklyTransportNetTotal', calc.totalTransportNet);

  // Other rows
  for (let i = 0; i < OTHER_ROWS; i++) {
    setMoney(`otherCostPw_${i}`, calc.otherResults[i].costPw);
    setMoney(`otherOtherPw_${i}`, calc.otherResults[i].costPw);
    setMoney(`otherNet_${i}`, calc.otherResults[i].net);
  }
  setMoney('weeklyOtherTotal', calc.totalOtherCost);
  setMoney('weeklyOtherNetTotal', calc.totalOtherNet);

  // Summary table
  setMoney('sumCareCore', calc.careCoreNet);
  setMoney('sumCareAdditional', calc.careAdditional);
  setMoney('sumCareGross', calc.careCoreNet + calc.careAdditional);
  setMoney('sumCareDiscount', calc.coreDiscount + calc.additionalDiscount);
  setMoney('sumCareNet', calc.careTotal);
  setMoney('sumCareForecast', calc.careForecast);

  setMoney('sumEduCore', calc.educationCoreNet);
  setMoney('sumEduAdditional', calc.educationAdditional);
  setMoney('sumEduGross', calc.educationCoreNet + calc.educationAdditional);
  setMoney('sumEduDiscount', 0);
  setMoney('sumEduNet', calc.educationTotal);
  setMoney('sumEduForecast', calc.educationForecast);

  setMoney('sumHealthCore', calc.healthCoreNet);
  setMoney('sumHealthAdditional', calc.healthAdditional);
  setMoney('sumHealthGross', calc.healthCoreNet + calc.healthAdditional);
  setMoney('sumHealthDiscount', 0);
  setMoney('sumHealthNet', calc.healthTotal);
  setMoney('sumHealthForecast', calc.healthForecast);

  setMoney('sumTotalCore', calc.totalCoreNet);
  setMoney('sumTotalAdditional', calc.totalAdditionalNet);
  setMoney('sumTotalGross', calc.totalGross);
  setMoney('sumTotalDiscount', calc.totalDiscount);
  setMoney('sumTotalNet', calc.weeklyNetCost);
  setMoney('sumTotalForecast', calc.totalForecast);

  // Retainer
  setMoney('retainerFinalCost', calc.retainerFinal);

  // One-off costs
  for (let i = 0; i < ONEOFF_ROWS; i++) {
    setMoney(`oneoffNet_${i}`, calc.oneoffResults[i].net);
  }
  setMoney('oneoffNetTotal', calc.totalOneoffNet);
}

function updateCoreRow(key, result) {
  setMoney(`core_costPw_${key}`, result.costPerWeek);
  setMoney(`core_net_${key}`, result.netCost);
}

function setMoney(id, amount) {
  const el = document.getElementById(id);
  if (el) el.textContent = formatCurrency(amount);
}

// ---- Event Handlers ----
function bindInputs() {
  // Provider details
  bindField('childInitials', 'childInitials');
  bindField('localAuthority', 'localAuthority');
  bindField('quoteStatus', 'quoteStatus');
  bindField('dateField', 'date');
  bindField('providerName', 'providerName');
  bindField('headHouseNo', 'headHouseNo');
  bindField('headStreet', 'headStreet');
  bindField('headTown', 'headTown');
  bindField('headCounty', 'headCounty');
  bindField('headPostCode', 'headPostCode');
  bindField('headTelephone', 'headTelephone');
  bindField('headEmail', 'headEmail');
  bindField('unitHouseNo', 'unitHouseNo');
  bindField('unitStreet', 'unitStreet');
  bindField('unitTown', 'unitTown');
  bindField('unitCounty', 'unitCounty');
  bindField('unitPostCode', 'unitPostCode');
  bindField('placementType', 'placementType');
  bindField('invoiceSchedule', 'invoiceSchedule');

  const presetSelect = document.getElementById('presetAddressSelect');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value);
      if (idx > 0) {
        const addr = PRESET_ADDRESSES[idx];
        setVal('unitHouseNo', addr.no); state.unitHouseNo = addr.no;
        setVal('unitStreet', addr.street); state.unitStreet = addr.street;
        setVal('unitTown', addr.town); state.unitTown = addr.town;
        setVal('unitCounty', addr.county); state.unitCounty = addr.county;
        setVal('unitPostCode', addr.post); state.unitPostCode = addr.post;
      }
    });
  }

  // Weeks
  bindNumericField('careWeeks', 'careWeeks');
  bindNumericField('educationWeeks', 'educationWeeks');
  bindNumericField('healthWeeks', 'healthWeeks');

  // Core costs
  bindCoreCost('carePlacement');
  bindCoreCost('careBusiness');
  bindCoreCost('careBuilding');
  bindCoreCost('education');
  bindCoreCost('health');

  // Additional rows
  for (let i = 0; i < STAFFING_ROWS; i++) bindAdditionalRow('staffing', 'staff', i);
  for (let i = 0; i < TRANSPORT_ROWS; i++) bindAdditionalRow('transport', 'trans', i);
  for (let i = 0; i < OTHER_ROWS; i++) bindAdditionalRow('other', 'other', i);

  // Retainer
  const retainerCheck = document.getElementById('retainerIndicative');
  if (retainerCheck) {
    retainerCheck.addEventListener('change', (e) => {
      state.retainerIndicative = e.target.checked;
      updateDisplay();
    });
  }
  bindNumericField('retainerBeforeDiscount', 'retainerBeforeDiscount');
  bindNumericField('retainerDiscount', 'retainerDiscount');

  // One-off costs
  for (let i = 0; i < ONEOFF_ROWS; i++) bindOneoffRow(i);
}

function bindField(elementId, stateKey) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state[stateKey] = e.target.value;
  });
}

function bindNumericField(elementId, stateKey) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.addEventListener('input', (e) => {
    state[stateKey] = parseNumber(e.target.value);
    updateDisplay();
  });
}

function bindCoreCost(key) {
  const rateEl = document.getElementById(`core_rate_${key}`);
  const unitsEl = document.getElementById(`core_units_${key}`);
  const discAmtEl = document.getElementById(`core_discAmt_${key}`);
  const discPctEl = document.getElementById(`core_discPct_${key}`);

  if (rateEl) {
    rateEl.addEventListener('input', (e) => {
      state.coreCosts[key].rate = parseNumber(e.target.value);
      updateDisplay();
    });
  }
  if (unitsEl) {
    unitsEl.addEventListener('input', (e) => {
      state.coreCosts[key].units = parseNumber(e.target.value);
      updateDisplay();
    });
  }
  if (discAmtEl) {
    discAmtEl.addEventListener('input', (e) => {
      const amt = parseNumber(e.target.value);
      state.coreCosts[key].discountAmount = amt;
      const costPw = state.coreCosts[key].rate * state.coreCosts[key].units;
      if (costPw > 0) {
        state.coreCosts[key].discountPercent = (amt / costPw) * 100;
        if (discPctEl) discPctEl.value = state.coreCosts[key].discountPercent.toFixed(2);
      }
      updateDisplay();
    });
  }
  if (discPctEl) {
    discPctEl.addEventListener('input', (e) => {
      const pct = parseNumber(e.target.value);
      state.coreCosts[key].discountPercent = pct;
      const costPw = state.coreCosts[key].rate * state.coreCosts[key].units;
      state.coreCosts[key].discountAmount = (pct / 100) * costPw;
      if (discAmtEl) discAmtEl.value = state.coreCosts[key].discountAmount.toFixed(2);
      updateDisplay();
    });
  }
}

function bindAdditionalRow(stateKey, prefix, index) {
  const typeEl = document.getElementById(`${prefix}Type_${index}`);
  const unitEl = document.getElementById(`${prefix}Unit_${index}`);
  const costEl = document.getElementById(`${prefix}Cost_${index}`);
  const numEl = document.getElementById(`${prefix}Num_${index}`);
  const discAmtEl = document.getElementById(`${prefix}DiscAmt_${index}`);
  const discPctEl = document.getElementById(`${prefix}DiscPct_${index}`);

  if (typeEl) typeEl.addEventListener('change', (e) => { state[stateKey][index].type = e.target.value; updateDisplay(); });
  if (unitEl) unitEl.addEventListener('change', (e) => { state[stateKey][index].unit = e.target.value; updateDisplay(); });
  if (costEl) costEl.addEventListener('input', (e) => { state[stateKey][index].cost = parseNumber(e.target.value); updateDisplay(); });
  if (numEl) numEl.addEventListener('input', (e) => { state[stateKey][index].numUnits = parseNumber(e.target.value); updateDisplay(); });
  if (discAmtEl) {
    discAmtEl.addEventListener('input', (e) => {
      const amt = parseNumber(e.target.value);
      state[stateKey][index].discountAmount = amt;
      const costPw = state[stateKey][index].cost * state[stateKey][index].numUnits;
      if (costPw > 0) {
        state[stateKey][index].discountPercent = (amt / costPw) * 100;
        if (discPctEl) discPctEl.value = state[stateKey][index].discountPercent.toFixed(2);
      }
      updateDisplay();
    });
  }
  if (discPctEl) {
    discPctEl.addEventListener('input', (e) => {
      const pct = parseNumber(e.target.value);
      state[stateKey][index].discountPercent = pct;
      const costPw = state[stateKey][index].cost * state[stateKey][index].numUnits;
      state[stateKey][index].discountAmount = (pct / 100) * costPw;
      if (discAmtEl) discAmtEl.value = state[stateKey][index].discountAmount.toFixed(2);
      updateDisplay();
    });
  }
}

function bindOneoffRow(index) {
  const typeEl = document.getElementById(`oneoffType_${index}`);
  const priceEl = document.getElementById(`oneoffPrice_${index}`);
  const discAmtEl = document.getElementById(`oneoffDiscAmt_${index}`);
  const discPctEl = document.getElementById(`oneoffDiscPct_${index}`);

  if (typeEl) typeEl.addEventListener('change', (e) => { state.oneoff[index].type = e.target.value; updateDisplay(); });
  if (priceEl) priceEl.addEventListener('input', (e) => { state.oneoff[index].price = parseNumber(e.target.value); updateDisplay(); });
  if (discAmtEl) {
    discAmtEl.addEventListener('input', (e) => {
      const amt = parseNumber(e.target.value);
      state.oneoff[index].discountAmount = amt;
      const price = state.oneoff[index].price;
      if (price > 0) {
        state.oneoff[index].discountPercent = (amt / price) * 100;
        if (discPctEl) discPctEl.value = state.oneoff[index].discountPercent.toFixed(2);
      }
      updateDisplay();
    });
  }
  if (discPctEl) {
    discPctEl.addEventListener('input', (e) => {
      const pct = parseNumber(e.target.value);
      state.oneoff[index].discountPercent = pct;
      state.oneoff[index].discountAmount = (pct / 100) * state.oneoff[index].price;
      if (discAmtEl) discAmtEl.value = state.oneoff[index].discountAmount.toFixed(2);
      updateDisplay();
    });
  }
}

// ---- HTML Generators ----
function buildSelectOptions(options) {
  return options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function buildCoreRow(key, label, unitLabel) {
  return `
    <tr id="row_core_${key}">
      <td><strong>${label}</strong></td>
      <td>${unitLabel}</td>
      <td><input type="number" class="tbl-input money-input" id="core_rate_${key}" step="0.01" min="0" placeholder="0.00" /></td>
      <td><input type="number" class="tbl-input money-input" id="core_units_${key}" value="1" min="1" style="width:60px" /></td>
      <td class="money" id="core_costPw_${key}">£ 0.00</td>
      <td><input type="number" class="tbl-input money-input" id="core_discAmt_${key}" step="0.01" min="0" placeholder="0.00" /></td>
      <td><input type="number" class="tbl-input money-input" id="core_discPct_${key}" step="0.01" min="0" max="100" placeholder="0.00" style="width:75px" /></td>
      <td class="money-net" id="core_net_${key}">£ 0.00</td>
    </tr>`;
}

function buildAdditionalRows(prefix, stateKey, types, count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
    <tr id="row_${prefix}_${i}">
      <td><select class="tbl-select" id="${prefix}Type_${i}">${buildSelectOptions(types)}</select></td>
      <td><select class="tbl-select" id="${prefix}Unit_${i}" style="min-width:130px">${buildSelectOptions(UNIT_MEASURES)}</select></td>
      <td><input type="number" class="tbl-input money-input" id="${prefix}Cost_${i}" step="0.01" min="0" placeholder="0.00" /></td>
      <td><input type="number" class="tbl-input money-input" id="${prefix}Num_${i}" step="1" min="0" placeholder="0" style="width:70px" /></td>
      <td class="money" id="${prefix}CostPw_${i}">£ 0.00</td>
      <td class="money" id="${prefix}${stateKey.charAt(0).toUpperCase() + stateKey.slice(1)}Pw_${i}">£ 0.00</td>
      <td><input type="number" class="tbl-input money-input" id="${prefix}DiscAmt_${i}" step="0.01" min="0" placeholder="0.00" /></td>
      <td><input type="number" class="tbl-input money-input" id="${prefix}DiscPct_${i}" step="0.01" min="0" max="100" placeholder="0.00" style="width:75px" /></td>
      <td class="money-net" id="${prefix}Net_${i}">£ 0.00</td>
    </tr>`;
  }
  return html;
}

function buildOneoffRows(count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
    <tr id="row_oneoff_${i}">
      <td><select class="tbl-select" id="oneoffType_${i}">${buildSelectOptions(ONEOFF_TYPES)}</select></td>
      <td><input type="number" class="tbl-input money-input" id="oneoffPrice_${i}" step="0.01" min="0" placeholder="0.00" /></td>
      <td class="text-right">One-off</td>
      <td><input type="number" class="tbl-input money-input" id="oneoffDiscAmt_${i}" step="0.01" min="0" placeholder="0.00" /></td>
      <td><input type="number" class="tbl-input money-input" id="oneoffDiscPct_${i}" step="0.01" min="0" max="100" placeholder="0.00" style="width:75px" /></td>
      <td class="money-net" id="oneoffNet_${i}">£ 0.00</td>
    </tr>`;
  }
  return html;
}

// ---- Local Storage ----
function saveToLocalStorage() {
  gatherInputState();
  if (!state.childInitials || state.childInitials.trim() === '') {
    alert("Please enter the Child's Initials in the Head Office Details before saving to create a profile.");
    return;
  }
  
  let profiles = {};
  const stored = localStorage.getItem('eclesia_profiles');
  if (stored) {
    try { profiles = JSON.parse(stored); } catch(e){}
  }
  
  profiles[state.childInitials.trim()] = state;
  localStorage.setItem('eclesia_profiles', JSON.stringify(profiles));
  
  // also save as current active state
  localStorage.setItem('quoteSheetState', JSON.stringify(state));
  
  populateProfileLoader();
  showToast('✓ Patient Profile saved successfully');
}

function loadProfile(initials) {
  if (!initials) return;
  const stored = localStorage.getItem('eclesia_profiles');
  if (stored) {
    try {
      const profiles = JSON.parse(stored);
      if (profiles[initials]) {
        state = { ...state, ...profiles[initials] };
        restoreInputState();
        updateDisplay();
        showToast('✓ Profile loaded');
      }
    } catch(e){}
  }
}

function populateProfileLoader() {
  const loader = document.getElementById('profileLoader');
  if (!loader) return;
  
  loader.innerHTML = '<option value="">-- Load Patient Profile --</option>';
  
  const stored = localStorage.getItem('eclesia_profiles');
  if (stored) {
    try {
      const profiles = JSON.parse(stored);
      Object.keys(profiles).forEach(key => {
        loader.innerHTML += `<option value="${key}">${key} (${profiles[key].quoteStatus || 'Draft'})</option>`;
      });
    } catch(e){}
  }
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('quoteSheetState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      return true;
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }
  return false;
}

function clearSavedData() {
  if (confirm('Are you sure you want to clear the current screen? (This does not delete your saved profiles over time).')) {
    localStorage.removeItem('quoteSheetState');
    location.reload();
  }
}

function gatherInputState() {
  // Gather text fields
  const textFields = ['childInitials', 'localAuthority', 'quoteStatus', 'providerName', 'headHouseNo', 'headStreet', 'headTown',
    'headCounty', 'headPostCode', 'headTelephone', 'headEmail', 'unitHouseNo', 'unitStreet',
    'unitTown', 'unitCounty', 'unitPostCode'];
  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });
  const dateEl = document.getElementById('dateField');
  if (dateEl) state.date = dateEl.value;
  const ptEl = document.getElementById('placementType');
  if (ptEl) state.placementType = ptEl.value;
  const isEl = document.getElementById('invoiceSchedule');
  if (isEl) state.invoiceSchedule = isEl.value;
}

function restoreInputState() {
  // Restore text fields
  setVal('childInitials', state.childInitials);
  setVal('localAuthority', state.localAuthority);
  setVal('quoteStatus', state.quoteStatus);
  setVal('dateField', state.date);
  setVal('providerName', state.providerName);
  setVal('headHouseNo', state.headHouseNo);
  setVal('headStreet', state.headStreet);
  setVal('headTown', state.headTown);
  setVal('headCounty', state.headCounty);
  setVal('headPostCode', state.headPostCode);
  setVal('headTelephone', state.headTelephone);
  setVal('headEmail', state.headEmail);
  setVal('unitHouseNo', state.unitHouseNo);
  setVal('unitStreet', state.unitStreet);
  setVal('unitTown', state.unitTown);
  setVal('unitCounty', state.unitCounty);
  setVal('unitPostCode', state.unitPostCode);
  setVal('placementType', state.placementType);
  setVal('invoiceSchedule', state.invoiceSchedule);

  // Weeks
  setVal('careWeeks', state.careWeeks);
  setVal('educationWeeks', state.educationWeeks);
  setVal('healthWeeks', state.healthWeeks);

  // Core costs
  for (const [key, val] of Object.entries(state.coreCosts)) {
    setVal(`core_rate_${key}`, val.rate || '');
    setVal(`core_units_${key}`, val.units);
    if (val.discountAmount) setVal(`core_discAmt_${key}`, val.discountAmount);
    if (val.discountPercent) setVal(`core_discPct_${key}`, val.discountPercent.toFixed(2));
  }

  // Additional rows
  restoreAdditionalRows('staff', 'staffing', STAFFING_ROWS);
  restoreAdditionalRows('trans', 'transport', TRANSPORT_ROWS);
  restoreAdditionalRows('other', 'other', OTHER_ROWS);

  // Retainer
  const retCheck = document.getElementById('retainerIndicative');
  if (retCheck) retCheck.checked = state.retainerIndicative;
  if (state.retainerBeforeDiscount) setVal('retainerBeforeDiscount', state.retainerBeforeDiscount);
  if (state.retainerDiscount) setVal('retainerDiscount', state.retainerDiscount);

  // One-off
  for (let i = 0; i < ONEOFF_ROWS; i++) {
    const row = state.oneoff[i];
    if (row) {
      setVal(`oneoffType_${i}`, row.type);
      if (row.price) setVal(`oneoffPrice_${i}`, row.price);
      if (row.discountAmount) setVal(`oneoffDiscAmt_${i}`, row.discountAmount);
      if (row.discountPercent) setVal(`oneoffDiscPct_${i}`, row.discountPercent.toFixed(2));
    }
  }
}

function restoreAdditionalRows(prefix, stateKey, count) {
  for (let i = 0; i < count; i++) {
    const row = state[stateKey][i];
    if (row) {
      setVal(`${prefix}Type_${i}`, row.type);
      setVal(`${prefix}Unit_${i}`, row.unit);
      if (row.cost) setVal(`${prefix}Cost_${i}`, row.cost);
      if (row.numUnits) setVal(`${prefix}Num_${i}`, row.numUnits);
      if (row.discountAmount) setVal(`${prefix}DiscAmt_${i}`, row.discountAmount);
      if (row.discountPercent) setVal(`${prefix}DiscPct_${i}`, row.discountPercent.toFixed(2));
    }
  }
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.value = value;
}

let isInvoicePrint = false;

// ---- PDF Export ----
function exportPDF() {
  isInvoicePrint = false;
  document.getElementById('metaInvoiceNo').style.display = 'none';
  window.print();
}

function exportInvoice() {
  const invNo = prompt('Enter Invoice Number (e.g. INV-001):', 'INV-');
  if (invNo !== null) {
    document.getElementById('printInvoiceNo').innerText = invNo.trim();
    document.getElementById('metaInvoiceNo').style.display = 'block';
    isInvoicePrint = true;
    window.print();
    isInvoicePrint = false;
  }
}

// ---- Initialization ----
function init() {
  const loaded = loadFromLocalStorage();

  // Build dynamic HTML
  buildPage();

  // Bind all inputs
  bindInputs();
  
  populateProfileLoader();
  document.getElementById('profileLoader')?.addEventListener('change', (e) => {
    loadProfile(e.target.value);
  });

  // Restore state if loaded
  if (loaded) {
    restoreInputState();
  }

  // Initial calculation
  updateDisplay();

  // Action buttons
  document.getElementById('btnSave')?.addEventListener('click', saveToLocalStorage);
  document.getElementById('btnExport')?.addEventListener('click', exportPDF);
  document.getElementById('btnExportInvoice')?.addEventListener('click', exportInvoice);
  document.getElementById('btnClear')?.addEventListener('click', clearSavedData);

  // ---- Dynamic Print Hiding Hooks ----
  window.addEventListener('beforeprint', () => {
    // 0. Populate Invoice Variables
    document.getElementById('printDocTitle').innerText = isInvoicePrint ? 'INVOICE' : 'QUOTE';
    document.getElementById('printLocalAuthority').innerText = document.getElementById('localAuthority').value || 'Local Authority';
    document.getElementById('printQuoteDate').innerText = document.getElementById('dateField').value || new Date().toLocaleDateString('en-GB');
    const childIni = document.getElementById('childInitials').value;
    document.getElementById('printClientInitials').innerText = childIni ? "Re: " + childIni : "";
    document.getElementById('printPhone').innerText = document.getElementById('headTelephone').value || "Provided upon request";
    
    const hNo = document.getElementById('headHouseNo').value;
    const hSt = document.getElementById('headStreet').value;
    const hTn = document.getElementById('headTown').value;
    document.getElementById('printAddress').innerText = [hNo, hSt, hTn].filter(Boolean).join(' ') || "Provided upon request";

    // 1. Hide Setup/Utility Rows
    document.getElementById('presetAddressGroup')?.classList.add('hide-for-print');
    document.getElementById('weeksRow')?.classList.add('hide-for-print');

    // 2. Hide Core Education if empty
    if (state.coreCosts.education.rate === 0) {
      document.getElementById('row_core_education')?.classList.add('hide-for-print');
      document.getElementById('row_core_education_sub')?.classList.add('hide-for-print');
      document.getElementById('row_summary_education')?.classList.add('hide-for-print');
    }

    // 3. Hide Core Health if empty
    if (state.coreCosts.health.rate === 0) {
      document.getElementById('row_core_health')?.classList.add('hide-for-print');
      document.getElementById('row_core_health_sub')?.classList.add('hide-for-print');
      document.getElementById('row_summary_health')?.classList.add('hide-for-print');
    }

    // 4. Hide empty rows in Additional sections and Oneoff
    const checkEmptyRows = (prefix, count, dataArray, cardId) => {
      let allEmpty = true;
      for (let i = 0; i < count; i++) {
        const row = document.getElementById(`row_${prefix}_${i}`);
        if (row) {
          if (!dataArray[i].type) {
            row.classList.add('hide-for-print');
          } else {
            allEmpty = false;
          }
        }
      }
      if (allEmpty) {
        document.getElementById(cardId)?.classList.add('hide-for-print');
      }
    };
    checkEmptyRows('staff', STAFFING_ROWS, state.staffing, 'cardStaffing');
    checkEmptyRows('trans', TRANSPORT_ROWS, state.transport, 'cardTransport');
    checkEmptyRows('other', OTHER_ROWS, state.other, 'cardOther');
    checkEmptyRows('oneoff', ONEOFF_ROWS, state.oneoff, 'cardOneoff');

    // 5. Hide Retainer if not enabled or 0
    if (!state.retainerIndicative || state.retainerBeforeDiscount === 0) {
      document.getElementById('cardRetainer')?.classList.add('hide-for-print');
    }
  });

  window.addEventListener('afterprint', () => {
    document.querySelectorAll('.hide-for-print').forEach(el => el.classList.remove('hide-for-print'));
  });
}

function buildPage() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <!-- Modern Invoice Print Header -->
    <div class="invoice-header print-only-layout">
      <div class="header-left">
        <img src="logo.png" alt="ECLESIA FAMILY CENTRE" class="invoice-logo" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22100%22><rect width=%22300%22 height=%22100%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2220%22 font-weight=%22bold%22 fill=%22%23215A75%22>ECLESIA LOGO</text></svg>'" />
        <div class="quote-to">
          <span class="to-label">Invoice To:</span><br>
          <strong class="to-org" id="printLocalAuthority">Local Authority</strong><br>
          <span id="printClientInitials"></span>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-title" id="printDocTitle">QUOTE</div>
        <div class="meta-item" id="metaInvoiceNo" style="display:none; margin-bottom:8px">
          <span class="label">INVOICE NO:</span>
          <span class="val" id="printInvoiceNo"></span>
        </div>
        <div class="meta-item">
          <span class="label">DATE:</span>
          <span class="val" id="printQuoteDate"></span>
        </div>
      </div>
    </div>

    <!-- Grand Total Banner -->
    <div class="grand-total-banner eclesia-style-banner">
      <div class="label">Total cost per week (excluding one-off costs)</div>
      <div class="amount"><span class="currency">£</span><span id="grandTotalAmount">0.00</span></div>
    </div>
    
    <div class="print-disclaimer">
      <p>If there is an error or omission in the cost information entered below, the price above and related cell(s) will show red. Please check the information entered and ensure it is complete and accurate prior to submitting this form.</p>
      <p>Enter Core Costs, Additional Costs and One-off Costs as applicable in the tables below</p>
    </div>

    <!-- App Header -->
    <div class="app-header">
      <h1>
        <span class="icon">📋</span>
        Social Care Placement Cost Quote Sheet
      </h1>
      <div class="header-actions">
        <select class="form-select" id="profileLoader" style="max-width: 200px; border-color: var(--primary-500); cursor: pointer; color: var(--text-primary); background-color: var(--bg-card);">
          <option value="">-- Load Profile --</option>
        </select>
        <button class="btn btn-primary" id="btnSave">💾 Save Profile</button>
        <button class="btn btn-secondary" id="btnExport">📄 Export Quote</button>
        <button class="btn btn-secondary" id="btnExportInvoice">📄 Generate Invoice</button>
        <button class="btn btn-danger" id="btnClear">🗑 Clear All</button>
      </div>
    </div>

    <!-- Provider Details -->
    <div class="detail-panels">
      <div class="card">
        <div class="card-header">
          <h2><span class="section-icon">🏢</span> Head Office Details</h2>
          <span class="badge">Provider</span>
        </div>

        <div class="form-grid-2" style="margin-bottom:16px">
          <div class="form-group">
            <label class="form-label">Quote Status</label>
            <select class="form-select" id="quoteStatus" style="font-weight: 500;">
              <option value="Draft Quote">Draft Quote</option>
              <option value="Quote Sent">Quote Sent</option>
              <option value="Quote Accepted">Quote Accepted</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Child's/Young Person's Initials (Save Key)</label>
            <input type="text" class="form-input" id="childInitials" placeholder="Enter initials to save profile" style="border: 1px solid #e1ad21;" />
          </div>
        </div>

        <div class="form-group full-width" style="margin-bottom:16px">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="dateField" />
        </div>

        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Invoice To / Local Authority</label>
            <input type="text" class="form-input" id="localAuthority" placeholder="Enter Local Authority name" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Provider Name</label>
            <input type="text" class="form-input" id="providerName" value="Eclesia Family Centre" readonly placeholder="Enter provider name" />
          </div>
          <div class="form-group">
            <label class="form-label">House Name / No.</label>
            <input type="text" class="form-input" id="headHouseNo" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Street Name</label>
            <input type="text" class="form-input" id="headStreet" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Town</label>
            <input type="text" class="form-input" id="headTown" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">County</label>
            <input type="text" class="form-input" id="headCounty" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Post Code</label>
            <input type="text" class="form-input" id="headPostCode" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Telephone Number</label>
            <input type="tel" class="form-input" id="headTelephone" placeholder="" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="headEmail" value="management@eclesia-limited.org" readonly placeholder="" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="margin-bottom: 12px;">
          <h2><span class="section-icon">🏠</span> Unit Address</h2>
          <span class="badge">Placement</span>
        </div>

        <div class="form-group" style="margin-bottom: 20px;" id="presetAddressGroup">
          <select class="form-select" id="presetAddressSelect" style="border-color: var(--primary-500); background-color: rgba(16, 185, 129, 0.05);">
            ${PRESET_ADDRESSES.map((a, i) => `<option value="${i}">${a.label}</option>`).join('')}
          </select>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">House Name / No.</label>
            <input type="text" class="form-input" id="unitHouseNo" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Street Name</label>
            <input type="text" class="form-input" id="unitStreet" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Town</label>
            <input type="text" class="form-input" id="unitTown" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">County</label>
            <input type="text" class="form-input" id="unitCounty" placeholder="" />
          </div>
          <div class="form-group">
            <label class="form-label">Post Code</label>
            <input type="text" class="form-input" id="unitPostCode" placeholder="" />
          </div>
        </div>

        <div class="form-grid-2" style="margin-top:16px">
          <div class="form-group">
            <label class="form-label">Placement Type</label>
            <select class="form-select" id="placementType">
              <option value="">Select type...</option>
              ${PLACEMENT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Invoice Schedule</label>
            <select class="form-select" id="invoiceSchedule">
              ${INVOICE_SCHEDULES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Core Costs -->
    <div class="card">
      <div class="card-header">
        <h2><span class="section-icon">💰</span> Core Costs — Weekly</h2>
        <span class="badge">Required</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cost Type</th>
              <th>Unit</th>
              <th>Rate per Unit (£)</th>
              <th>Fixed Units</th>
              <th>Cost per Week</th>
              <th>Discount Amount (£)</th>
              <th>Discount %</th>
              <th>NET Core Costs</th>
            </tr>
          </thead>
          <tbody>
            ${buildCoreRow('carePlacement', 'Care Placement', 'Week')}
            ${buildCoreRow('careBusiness', 'Care Business', 'Week')}
            ${buildCoreRow('careBuilding', 'Care Building', 'Week')}
            <tr class="total-row">
              <td colspan="4" style="text-align:right">Care Sub-total</td>
              <td class="money-net" id="careCoreSubtotal">£ 0.00</td>
              <td colspan="2"></td>
              <td class="money-net" id="careCoreSubtotalNet">£ 0.00</td>
            </tr>
            ${buildCoreRow('education', 'Education', 'Week')}
            <tr class="total-row" id="row_core_education_sub">
              <td colspan="4" style="text-align:right">Education Sub-total</td>
              <td class="money-net" id="educationCoreSubtotal">£ 0.00</td>
              <td colspan="2"></td>
              <td class="money-net" id="educationCoreSubtotalNet">£ 0.00</td>
            </tr>
            ${buildCoreRow('health', 'Health (if required)', 'Week')}
            <tr class="total-row" id="row_core_health_sub">
              <td colspan="4" style="text-align:right">Health Sub-total</td>
              <td class="money-net" id="healthCoreSubtotal">£ 0.00</td>
              <td colspan="2"></td>
              <td class="money-net" id="healthCoreSubtotalNet">£ 0.00</td>
            </tr>
            <tr class="total-row" style="background: rgba(6,78,59,0.5) !important">
              <td colspan="4" style="text-align:right; font-size:1rem"><strong>WEEKLY CORE COST TOTAL</strong></td>
              <td class="money-net" id="weeklyCoreTotal" style="font-size:1rem">£ 0.00</td>
              <td colspan="2"></td>
              <td class="money-net" id="weeklyCoreNetTotal" style="font-size:1rem">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Guidance -->
      <div class="guidance-panel">
        <h3>Core Costs Guidance</h3>
        <p><strong>Placement Care costs:</strong> Core care staff/shared staff both day and night (present without the young person in placement), allowances (pocket money, clothing, toiletries etc), specialist equipment to meet service user care needs.</p>
        <p><strong>Business costs:</strong> Staff training, registration with Ofsted, recruitment (included DBS checks), corporate overheads.</p>
        <p><strong>Building costs:</strong> Rent, repairs and maintenance, waste disposal, insurance, council tax, utilities (e.g. gas, water, electric), tv licence, telephones inc. mobiles.</p>
        <p><strong>Education costs:</strong> All education services include all standard timetabled curricular activities but exclude additional education services where required to meet particular needs of young person as outlined in the Referral Form.</p>
        <p><strong>Health costs:</strong> All services provided as standard to meet the health requirements of the young person as outlined within the Referral Form.</p>
      </div>
    </div>

    <!-- Additional Staffing -->
    <div class="card" id="cardStaffing">
      <div class="card-header">
        <h2><span class="section-icon">👥</span> Additional Costs — Staffing</h2>
        <span class="badge">Weekly</span>
      </div>

      <div class="print-disclaimer-additional">
        <p>ADDITIONAL COSTS - complete weekly <u>service type</u>, <u>unit measure</u>, <u>cost per unit</u>, <u>number of units</u> and <u>discount amount</u> in the columns below.</p>
        <p>This is for provision of weekly services over and above those included in the weekly Core costs above.</p>
        <p class="text-green">The costs below are time limited, the duration will be specified in the purchase order. A new purchase order will be raised for any changes to duration.</p>
        <p class="text-red">Where unit cost is entered but associated items are incomplete, these cells will show red until details are selected or entered accordingly.</p>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Select Staffing Type</th>
              <th>Unit Measure</th>
              <th>Enter Cost (£)</th>
              <th>No. Units</th>
              <th>Cost p/w</th>
              <th>Staffing p/w</th>
              <th>Discount Amount (£)</th>
              <th>Discount %</th>
              <th>NET Additional Staffing</th>
            </tr>
          </thead>
          <tbody>
            ${buildAdditionalRows('staff', 'staffing', STAFFING_TYPES, STAFFING_ROWS)}
            <tr class="total-row">
              <td colspan="4" style="text-align:right"><strong>WEEKLY ADDITIONAL STAFFING TOTAL</strong></td>
              <td class="money-net" id="weeklyStaffingTotal">£ 0.00</td>
              <td colspan="3"></td>
              <td class="money-net" id="weeklyStaffingNetTotal">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Additional Transport -->
    <div class="card" id="cardTransport">
      <div class="card-header">
        <h2><span class="section-icon">🚐</span> Additional Costs — Transport</h2>
        <span class="badge">Weekly</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Select Transport Type</th>
              <th>Unit Measure</th>
              <th>Enter Cost (£)</th>
              <th>No. Units</th>
              <th>Cost p/w</th>
              <th>Transport p/w</th>
              <th>Discount Amount (£)</th>
              <th>Discount %</th>
              <th>NET Additional Transport</th>
            </tr>
          </thead>
          <tbody>
            ${buildAdditionalRows('trans', 'transport', TRANSPORT_TYPES, TRANSPORT_ROWS)}
            <tr class="total-row">
              <td colspan="4" style="text-align:right"><strong>WEEKLY ADDITIONAL TRANSPORT TOTAL</strong></td>
              <td class="money-net" id="weeklyTransportTotal">£ 0.00</td>
              <td colspan="3"></td>
              <td class="money-net" id="weeklyTransportNetTotal">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Additional Other -->
    <div class="card" id="cardOther">
      <div class="card-header">
        <h2><span class="section-icon">📦</span> Additional Costs — Other</h2>
        <span class="badge">Weekly</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Select Other Cost Type</th>
              <th>Unit Measure</th>
              <th>Enter Cost (£)</th>
              <th>No. Units</th>
              <th>Cost p/w</th>
              <th>Other p/w</th>
              <th>Discount Amount (£)</th>
              <th>Discount %</th>
              <th>NET Additional Other</th>
            </tr>
          </thead>
          <tbody>
            ${buildAdditionalRows('other', 'other', OTHER_TYPES, OTHER_ROWS)}
            <tr class="total-row">
              <td colspan="4" style="text-align:right"><strong>WEEKLY ADDITIONAL OTHER TOTAL</strong></td>
              <td class="money-net" id="weeklyOtherTotal">£ 0.00</td>
              <td colspan="3"></td>
              <td class="money-net" id="weeklyOtherNetTotal">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary of Weekly Costs -->
    <div class="card">
      <div class="card-header">
        <h2><span class="section-icon">📊</span> Summary of Weekly Costs</h2>
        <span class="badge">Overview</span>
      </div>

      <div class="table-wrapper">
        <table class="summary-table">
          <thead>
            <tr>
              <th style="text-align:left">Category</th>
              <th>Core</th>
              <th>Additional</th>
              <th>Total (Gross)</th>
              <th>Discount</th>
              <th>Weekly Net Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Care</td>
              <td class="money" id="sumCareCore">£ 0.00</td>
              <td class="money" id="sumCareAdditional">£ 0.00</td>
              <td class="money" id="sumCareGross">£ 0.00</td>
              <td class="money" id="sumCareDiscount">£ 0.00</td>
              <td class="money-net" id="sumCareNet">£ 0.00</td>
            </tr>
            <tr id="row_summary_education">
              <td>Education</td>
              <td class="money" id="sumEduCore">£ 0.00</td>
              <td class="money" id="sumEduAdditional">£ 0.00</td>
              <td class="money" id="sumEduGross">£ 0.00</td>
              <td class="money" id="sumEduDiscount">£ 0.00</td>
              <td class="money-net" id="sumEduNet">£ 0.00</td>
            </tr>
            <tr id="row_summary_health">
              <td>Health</td>
              <td class="money" id="sumHealthCore">£ 0.00</td>
              <td class="money" id="sumHealthAdditional">£ 0.00</td>
              <td class="money" id="sumHealthGross">£ 0.00</td>
              <td class="money" id="sumHealthDiscount">£ 0.00</td>
              <td class="money-net" id="sumHealthNet">£ 0.00</td>
            </tr>
            <tr class="summary-total">
              <td>Total Weekly</td>
              <td id="sumTotalCore">£ 0.00</td>
              <td id="sumTotalAdditional">£ 0.00</td>
              <td id="sumTotalGross">£ 0.00</td>
              <td id="sumTotalDiscount">£ 0.00</td>
              <td id="sumTotalNet">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Retainer -->
    <div class="card" id="cardRetainer">
      <div class="card-header">
        <h2><span class="section-icon">🔒</span> Retainer</h2>
        <span class="badge">Optional</span>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">
        Cost to "hold" accommodation package during, for example, a transitional period between placements, or to secure placement prior to occupancy.
      </p>
      <div class="retainer-grid">
        <div class="form-group">
          <label class="form-label">Retainer (Indicative)</label>
          <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
            <input type="checkbox" id="retainerIndicative" style="width:20px;height:20px;accent-color:var(--primary-500)" />
            <span style="font-size:0.85rem;color:var(--text-secondary)">Enable retainer</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Before Discount (£)</label>
          <input type="number" class="form-input" id="retainerBeforeDiscount" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">Discount (£)</label>
          <input type="number" class="form-input" id="retainerDiscount" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">Retainer Final Cost</label>
          <div style="padding:10px 14px;background:var(--bg-total-row);border-radius:var(--radius-sm);font-weight:700;color:#fff;font-size:1rem" id="retainerFinalCost">£ 0.00</div>
        </div>
      </div>
    </div>

    <!-- One-Off Costs -->
    <div class="card" id="cardOneoff">
      <div class="card-header">
        <h2><span class="section-icon">⚡</span> One-Off Costs</h2>
        <span class="badge" style="background:rgba(239,68,68,0.12);color:var(--red-400)">One-time</span>
      </div>
      <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;">
        Anticipated additional services that will be a one-off cost and invoiced accordingly. Multiple provision should enter under Additional Weekly costs.
      </p>

      <div class="table-wrapper">
        <table class="oneoff-table">
          <thead>
            <tr>
              <th>Cost Description</th>
              <th>Price (£)</th>
              <th>Type</th>
              <th>Discount Amount (£)</th>
              <th>Discount %</th>
              <th>NET One-off Costs</th>
            </tr>
          </thead>
          <tbody>
            ${buildOneoffRows(ONEOFF_ROWS)}
            <tr class="total-row">
              <td colspan="5" style="text-align:right"><strong>ONE-OFF NET COST TOTAL</strong></td>
              <td class="money-net" id="oneoffNetTotal">£ 0.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Print Footer -->
    <div class="invoice-footer print-only-layout">
      <div class="footer-top">
        <div class="footer-terms">
          <strong>TERMS & CONDITIONS:</strong><br>
          <span class="terms-text">Prices quoted are valid for 30 days. Weekly costs are an estimate based on the stated provision.</span>
          <br><br>
          <strong>Payment Info:</strong><br>
          <span class="terms-text">Account details provided upon invoice.</span>
        </div>
        <div class="footer-sign">
          <div class="sign-line"></div>
          <span>Authorised Signatory</span>
        </div>
      </div>
      <div class="footer-contact">
        <span><strong>Phone:</strong> <span id="printPhone"></span></span>
        <span><strong>Address:</strong> <span id="printAddress"></span></span>
        <span><strong>E-mail:</strong> management@eclesia-limited.org</span>
      </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast"></div>
  `;
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', init);
