import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Image, Alert, Dimensions, Platform,
  StatusBar, KeyboardAvoidingView, ActivityIndicator,
  SafeAreaView, FlatList, TouchableWithoutFeedback, Keyboard, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Circle } from 'react-native-svg';

const BACKEND_URL = 'https://caloriapp-backend-production.up.railway.app';

const C = {
  bg: '#0d0f14', surface: '#161920', card: '#1e2229', border: '#2a2f3a',
  lime: '#c6f135', text: '#f0f2f5', muted: '#7a8494',
  danger: '#ff5c5c', orange: '#ff9f43', blue: '#74b9ff',
};

const MODES_BASE = [
  { id:'bulk',   icon:'💪', color:'#74b9ff', delta:+400 },
  { id:'bulk_s', icon:'🏋️', color:'#c6f135', delta:+200 },
  { id:'maint',  icon:'⚖️', color:'#f0f2f5', delta:0    },
  { id:'cut_s',  icon:'🔥', color:'#ff9f43', delta:-250 },
  { id:'cut',    icon:'⚡', color:'#ff5c5c', delta:-500 },
  { id:'cut_x',  icon:'🎯', color:'#ff3030', delta:-750 },
];
function getMODES(t){ return MODES_BASE.map((m,i)=>({...m,title:t.modeNames[i],sub:t.modeSubs[i]})); }

const ACTIVITY_VALS = [1.2,1.375,1.55,1.725,1.9];
function getACTIVITY(t){ return ACTIVITY_VALS.map((v,i)=>({value:v,label:t.activityLevels[i]})); }

const MEAL_IDS = ['breakfast','lunch','snack','dinner','extra'];
const MEAL_ICONS = ['🌅','🥗','🍎','🌙','🍫'];
function getMEAL_TYPES(t){ return MEAL_IDS.map((id,i)=>({id,icon:MEAL_ICONS[i],label:t.mealTypes[i]})); }

const TR = {
  es: {
    appName: ['Calori','app'],
    today: 'Hoy', close: 'Cerrar', cancel: 'Cancelar', save: 'Guardar y aplicar',
    remaining: 'kcal restantes', over: 'kcal de más ⚠️',
    meals: 'comidas', goal: 'objetivo', left: 'restantes',
    logTitle: 'Registro de hoy', history: '📋 Historial', closeDay: '✓ Cerrar día', clear: '🗑 Limpiar',
    addMeal: 'Añadir comida', photo: '📷 Foto', describe: '✏️ Describir',
    analyzing: 'Analizando...', processing: 'Procesando', estimating: 'Estimando calorías y macros...',
    identified: '¡Identificado!', reviewNutri: 'Revisa y confirma el análisis nutricional.',
    addToLog: '✓ Añadir al registro', analyzeOther: 'Analizar otra',
    somethingFailed: 'Algo falló', couldNotAnalyze: 'No se pudo analizar. Inténtalo de nuevo.', retry: 'Intentar de nuevo',
    whatDidYouEat: '¿Qué has comido?', mealType: 'Tipo de comida',
    photoHint: 'Sube una foto y la IA identifica los alimentos y calcula calorías.',
    textHint: 'Escribe los ingredientes con cantidades y la IA calcula calorías y macros.',
    textPlaceholder: 'Ej: 400g yogur griego light, 30g proteína vainilla, 1 cucharada de chía...',
    calcCalories: 'Calcular calorías →', takePhoto: '📸 Hacer foto', fromGallery: '🖼️ Subir de galería',
    profileTitle: 'Perfil y objetivo', profileSub: 'Introduce tus datos para calcular tu gasto calórico y elegir tu modo.',
    apiKeyTitle: 'API Key de Anthropic', apiKeyHint: 'Necesaria para analizar fotos y recetas. Consíguela gratis en console.anthropic.com',
    personalData: 'Datos personales', sex: 'Sexo', male: 'Hombre', female: 'Mujer',
    age: 'Edad', currentWeight: 'Peso actual (kg)', targetWeight: 'Peso objetivo (kg)', height: 'Altura (cm)', activity: 'Actividad',
    activityLevels: ['Sedentario','Ligero (1-3 días/sem)','Moderado (3-5 días)','Activo (6-7 días)','Muy activo'],
    chooseMode: 'Elige tu modo', language: 'Idioma',
    modeNames: ['Volumen','Volumen suave','Mantenimiento','Déficit leve','Definición','Corte agresivo'],
    modeSubs: ['Ganar masa muscular','Músculo con mínima grasa','Mantener el peso actual','Perder grasa poco a poco','Pérdida de grasa moderada','Máxima pérdida, corto plazo'],
    mealTypes: ['Desayuno','Almuerzo','Merienda','Cena','Snack'],
    historyTitle: 'Historial', noHistory: 'Sin historial todavía.\nCierra tu primer día para verlo aquí.',
    foodList: 'Comidas', addFood: '✏️ Añadir comida', editClosed: '🔒 Edición cerrada (+24h)', deleteEntry: '🗑 Eliminar',
    closeRegister: 'Cerrar registro', closeRegisterQ: '¿Cerrar el registro de hoy y guardarlo en el historial?',
    closeDayBtn: 'Cerrar día', saved: '¡Guardado! 💪', savedMsg: 'Registro cerrado y guardado en el historial.',
    noMeals: 'Sin comidas', noMealsMsg: 'Añade al menos una comida antes de cerrar el día.',
    clearAll: 'Limpiar todo', clearQ: '¿Borrar el registro de hoy?', delete: 'Borrar',
    deleteEntry2: 'Borrar registro', deleteEntryQ: '¿Eliminar este registro del historial?',
    editMeal: 'Editar comida', editMealSub: 'Describe el alimento o receta corregida y la IA recalculará las calorías y macros.',
    currentFood: 'Alimento actual:', correction: 'Corrección:', recalculate: 'Recalcular con IA →',
    emptyToday: 'Aún no has registrado nada hoy.\nAñade tu primera comida.',
    protein: 'Proteína', carbs: 'Carbos', fat: 'Grasa', kcal: 'kcal', prot: 'prot',
    macroDetail: ['Proteína','Carbohidratos','Grasa'],
    macroInfo: [
      'Esencial para construir y reparar músculo. Tu objetivo es {goal}g al día (2.2g por kg de peso corporal).',
      'Principal fuente de energía. Tu objetivo es {goal}g al día para mantener energía óptima.',
      'Necesaria para hormonas y absorción de vitaminas. Tu objetivo es {goal}g al día.',
    ],
    dailyGoal: 'Objetivo diario', consumed: 'Consumido', remaining2: 'Restante',
    tolose: 'Por perder', togain: 'Por ganar', goalReached: '¡Objetivo alcanzado!',
    weightActual: 'Actual', weightGoal: 'Objetivo', weightToReach: 'kg para llegar a',
    editingClosed: 'Editando registro cerrado. La comida se añadirá a ese registro.',
    tdeeLabel: 'TDEE · Mantenimiento', currentGoal: 'Objetivo actual',
    reduce: '↓ reducir', increase: '↑ aumentar', toReach: 'kg para llegar a',
    portion: 'Porción', ok: 'OK', apiFormat: '✓ Formato correcto', apiWrong: '⚠️ Debe empezar por sk-ant-',
    apiSaved: '✓ API key guardada', apiMissing: '⚠️ Sin API key — la IA no funcionará',
    welcome: 'Bienvenido a CaloriApp', welcomeSub: 'Para analizar fotos y recetas con IA necesitas una API key gratuita de Anthropic.',
    welcomeSteps: '1. Ve a console.anthropic.com\n2. Crea una cuenta gratis\n3. API Keys > Create Key\n4. Pégala aquí 👇',
    start: 'Empezar →', missingKey: 'Falta la API key', enterKey: 'Introdúcela para continuar',
    kcalDay: 'kcal / día', maintenance: 'Mantenimiento',
    inObjective: '✓ Dentro del objetivo', aboveObjective: '⚠️ +{diff} kcal sobre objetivo',
    recalculating: 'Recalculando con IA...',
    noRecord: 'Sin registro',
  },
  en: {
    appName: ['Calori','app'],
    today: 'Today', close: 'Close', cancel: 'Cancel', save: 'Save & apply',
    remaining: 'kcal remaining', over: 'kcal over ⚠️',
    meals: 'meals', goal: 'goal', left: 'remaining',
    logTitle: "Today's log", history: '📋 History', closeDay: '✓ Close day', clear: '🗑 Clear',
    addMeal: 'Add meal', photo: '📷 Photo', describe: '✏️ Describe',
    analyzing: 'Analyzing...', processing: 'Processing', estimating: 'Estimating calories & macros...',
    identified: 'Identified!', reviewNutri: 'Review and confirm the nutritional analysis.',
    addToLog: '✓ Add to log', analyzeOther: 'Analyze another',
    somethingFailed: 'Something went wrong', couldNotAnalyze: 'Could not analyze. Try again.', retry: 'Try again',
    whatDidYouEat: 'What did you eat?', mealType: 'Meal type',
    photoHint: 'Upload a photo and AI identifies the food and calculates calories.',
    textHint: 'Write the ingredients with quantities and AI calculates calories and macros.',
    textPlaceholder: 'E.g.: 400g Greek yogurt, 30g vanilla protein, 1 tbsp chia seeds...',
    calcCalories: 'Calculate calories →', takePhoto: '📸 Take photo', fromGallery: '🖼️ From gallery',
    profileTitle: 'Profile & goal', profileSub: 'Enter your data to calculate your caloric expenditure and choose your mode.',
    apiKeyTitle: 'Anthropic API Key', apiKeyHint: 'Required to analyze photos and recipes. Get it free at console.anthropic.com',
    personalData: 'Personal data', sex: 'Gender', male: 'Male', female: 'Female',
    age: 'Age', currentWeight: 'Current weight (kg)', targetWeight: 'Target weight (kg)', height: 'Height (cm)', activity: 'Activity',
    activityLevels: ['Sedentary','Light (1-3 days/week)','Moderate (3-5 days)','Active (6-7 days)','Very active'],
    chooseMode: 'Choose your mode', language: 'Language',
    modeNames: ['Bulk','Lean bulk','Maintenance','Mild deficit','Cut','Aggressive cut'],
    modeSubs: ['Build muscle mass','Muscle with minimal fat','Maintain current weight','Lose fat slowly','Moderate fat loss','Maximum loss, short term'],
    mealTypes: ['Breakfast','Lunch','Snack','Dinner','Extra'],
    historyTitle: 'History', noHistory: 'No history yet.\nClose your first day to see it here.',
    foodList: 'Meals', addFood: '✏️ Add meal', editClosed: '🔒 Editing closed (+24h)', deleteEntry: '🗑 Delete',
    closeRegister: 'Close log', closeRegisterQ: "Close today's log and save it to history?",
    closeDayBtn: 'Close day', saved: 'Saved! 💪', savedMsg: 'Log closed and saved to history.',
    noMeals: 'No meals', noMealsMsg: 'Add at least one meal before closing the day.',
    clearAll: 'Clear all', clearQ: "Delete today's log?", delete: 'Delete',
    deleteEntry2: 'Delete log', deleteEntryQ: 'Delete this log from history?',
    editMeal: 'Edit meal', editMealSub: 'Describe the corrected food or recipe and AI will recalculate calories and macros.',
    currentFood: 'Current food:', correction: 'Correction:', recalculate: 'Recalculate with AI →',
    emptyToday: "Nothing logged today yet.\nAdd your first meal.",
    protein: 'Protein', carbs: 'Carbs', fat: 'Fat', kcal: 'kcal', prot: 'prot',
    macroDetail: ['Protein','Carbohydrates','Fat'],
    macroInfo: [
      'Essential for building and repairing muscle. Your daily goal is {goal}g (2.2g per kg of body weight).',
      'Main energy source. Your daily goal is {goal}g to maintain optimal energy.',
      'Needed for hormones and vitamin absorption. Your daily goal is {goal}g.',
    ],
    dailyGoal: 'Daily goal', consumed: 'Consumed', remaining2: 'Remaining',
    tolose: 'To lose', togain: 'To gain', goalReached: 'Goal reached!',
    weightActual: 'Current', weightGoal: 'Goal', weightToReach: 'kg to reach',
    editingClosed: 'Editing closed log. Meal will be added to that record.',
    tdeeLabel: 'TDEE · Maintenance', currentGoal: 'Current goal',
    reduce: '↓ reduce', increase: '↑ increase', toReach: 'kg to reach',
    portion: 'Portion', ok: 'OK', apiFormat: '✓ Correct format', apiWrong: '⚠️ Must start with sk-ant-',
    apiSaved: '✓ API key saved', apiMissing: "⚠️ No API key — AI won't work",
    welcome: 'Welcome to CaloriApp', welcomeSub: 'To analyze photos and recipes with AI you need a free Anthropic API key.',
    welcomeSteps: '1. Go to console.anthropic.com\n2. Create a free account\n3. API Keys > Create Key\n4. Paste it here 👇',
    start: 'Get started →', missingKey: 'Missing API key', enterKey: 'Enter it to continue',
    kcalDay: 'kcal / day', maintenance: 'Maintenance',
    inObjective: '✓ Within goal', aboveObjective: '⚠️ +{diff} kcal above goal',
    recalculating: 'Recalculating with AI...',
    noRecord: 'No record',
  }
};

function todayKey(){ return new Date().toISOString().split('T')[0]; }
function timeNow(){ return new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}); }
function formatDate(lang){
  const d=new Date();
  if(lang==='en'){
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
  }
  const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
function calcTDEE(p){
  if(!p.weight||!p.height||!p.age) return 2000;
  const bmr = p.sex==='m' ? 10*p.weight+6.25*p.height-5*p.age+5 : 10*p.weight+6.25*p.height-5*p.age-161;
  return Math.round(bmr*(p.activity||1.55));
}
function calcGoal(p){
  const tdee=calcTDEE(p);
  const mode=MODES_BASE.find(m=>m.id===p.mode)||MODES_BASE[2];
  return Math.max(1000,tdee+mode.delta);
}
function calcMacros(kcal,weight){
  const protein=Math.round((weight||70)*2.2);
  const fat=Math.round((weight||70)*0.9);
  const carbs=Math.round(Math.max(50,(kcal-protein*4-fat*9)/4));
  return {protein,fat,carbs};
}

// ─── RING ────────────────────────────────────────────────────
function Ring({ total, goal, color }){
  const r=40, circ=2*Math.PI*r;
  const pct=Math.min(1,goal>0?total/goal:0);
  const offset=circ-(circ*pct);
  return (
    <View style={{width:96,height:96,alignItems:'center',justifyContent:'center'}}>
      <Svg width={96} height={96} style={{position:'absolute',transform:[{rotate:'-90deg'}]}}>
        <Circle cx={48} cy={48} r={r} stroke={C.card} strokeWidth={8} fill="none"/>
        <Circle cx={48} cy={48} r={r} stroke={total>goal?C.danger:color} strokeWidth={8} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
      </Svg>
      <Text style={{fontWeight:'700',fontSize:18,color:C.text,lineHeight:20}}>{total}</Text>
      <Text style={{fontSize:9,color:C.muted,letterSpacing:0.5,textTransform:'uppercase'}}>kcal</Text>
    </View>
  );
}

// ─── MACRO BAR ───────────────────────────────────────────────
function MacroBar({ label, value, max, color, onPress }){
  const pct=Math.min(100,max>0?(value/max)*100:0);
  return (
    <TouchableOpacity style={{marginBottom:8}} onPress={onPress} activeOpacity={0.7}>
      <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
        <Text style={{fontSize:11,color:C.muted}}>{label}</Text>
        <Text style={{fontSize:11,color:C.text}}>{Math.round(value)}g</Text>
      </View>
      <View style={{height:4,backgroundColor:C.card,borderRadius:99,overflow:'hidden'}}>
        <View style={{height:4,width:`${pct}%`,backgroundColor:color,borderRadius:99}}/>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
export default function App(){
  const [profile,setProfile]=useState({sex:'m',age:0,weight:0,targetWeight:0,height:0,activity:1.55,mode:'maint'});
  const [meals,setMeals]=useState([]);
  const [devCode,setDevCode]=useState('');
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showHistory,setShowHistory]=useState(false);
  const [history,setHistory]=useState([]);
  const [editingEntryIdx,setEditingEntryIdx]=useState(null);
  const slideAnim=useRef(new Animated.Value(800)).current;

  function openHistory(){
    setShowHistory(true);
    Animated.spring(slideAnim,{toValue:0,useNativeDriver:true,tension:65,friction:11}).start();
  }
  function closeHistory(){
    Animated.timing(slideAnim,{toValue:800,duration:250,useNativeDriver:true}).start(()=>setShowHistory(false));
  }
  const [customAlert,setCustomAlert]=useState(null);
  // customAlert = { title, message, buttons: [{text, onPress, style}] }
  function showAlert(title, message, buttons){
    setCustomAlert({title, message, buttons: buttons||[{text:'OK'}]});
  }
  const [obKey,setObKey]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [mealType,setMealType]=useState(null);         // selected meal type
  const [showEditMeal,setShowEditMeal]=useState(false); // edit meal modal
  const [editMealIdx,setEditMealIdx]=useState(null);    // index of meal being edited
  const [editMealData,setEditMealData]=useState({});    // form data for edit
  const [expandedEntry,setExpandedEntry]=useState(null);// expanded history entry idx
  const [selectedMeal,setSelectedMeal]=useState(null); // meal detail popup
  const [lang,setLang]=useState('es');
  const [isSubscribed,setIsSubscribed]=useState(false);
  const [showPaywall,setShowPaywall]=useState(false);
  const [showMacroModal,setShowMacroModal]=useState(null); // 'protein'|'carbs'|'fat'
  const [dailyAnalyses,setDailyAnalyses]=useState(0);
  const DAILY_LIMIT=10;
  const isDev=devCode==='Jcg12345';
  function isUnlimited(){ return isDev; }
  const t=TR[lang]||TR.es;
  const MODES=getMODES(t);
  const ACTIVITY=getACTIVITY(t);
  const MEAL_TYPES=getMEAL_TYPES(t);
  const [showSettings,setShowSettings]=useState(false);
  const [addTab,setAddTab]=useState('photo');
  const [addPrevStep,setAddPrevStep]=useState('photo'); // 'photo'|'text'
  const [addStep,setAddStep]=useState('upload'); // upload | analyzing | result | error
  const [pendingMeal,setPendingMeal]=useState(null);
  const [pendingImg,setPendingImg]=useState(null);
  const [errorMsg,setErrorMsg]=useState('');
  const [recipeText,setRecipeText]=useState('');

  // Settings form state
  const [fSex,setFSex]=useState('m');
  const [fAge,setFAge]=useState('');
  const [fWeight,setFWeight]=useState('');
  const [fTargetWeight,setFTargetWeight]=useState('');
  const [fHeight,setFHeight]=useState('');
  const [fActivity,setFActivity]=useState(1.55);
  const [fMode,setFMode]=useState('maint');
  const [fDevCode,setFDevCode]=useState('');

  // Load data
  useEffect(()=>{
    (async()=>{
      try{
        const p=await AsyncStorage.getItem('cprofile');
        if(p) setProfile(JSON.parse(p));
        // devCode always resets on app open - intentionally not loaded from storage
        const m=await AsyncStorage.getItem('cmeals_today');
        if(m){ const d=JSON.parse(m); if(d.date===todayKey()) setMeals(d.meals); }
        const sub=await AsyncStorage.getItem('csubscribed');
        if(sub) setIsSubscribed(JSON.parse(sub));
        const lg=await AsyncStorage.getItem('clang');
        if(lg) setLang(lg);
        const da=await AsyncStorage.getItem('cdaily_analyses');
        if(da){
          const d=JSON.parse(da);
          if(d.date===todayKey()) setDailyAnalyses(d.count||0);
          else { AsyncStorage.setItem('cdaily_analyses',JSON.stringify({date:todayKey(),count:0})).catch(()=>{}); }
        }
        const h=await AsyncStorage.getItem('chistory');
        if(h){
          const parsed=JSON.parse(h);
          const migrated=parsed.map((e,i)=>e.id?e:{...e,id:e.date+'-'+i+'-'+Math.random().toString(36).slice(2)});
          setHistory(migrated);
          AsyncStorage.setItem('chistory',JSON.stringify(migrated)).catch(()=>{});
        }
        const launched=await AsyncStorage.getItem('claunched');
        if(!launched){ setTimeout(()=>setShowOnboarding(true),600); AsyncStorage.setItem('claunched','1').catch(()=>{}); }
        else if(!p) setTimeout(()=>openSettings(),600);
      }catch(e){ console.log('Load error',e); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const saveMeals=(m)=>{ AsyncStorage.setItem('cmeals_today',JSON.stringify({date:todayKey(),meals:m})).catch(()=>{}); };
  const saveProfile=(p)=>{ AsyncStorage.setItem('cprofile',JSON.stringify(p)).catch(()=>{}); };
  const saveHistory=(h)=>{ AsyncStorage.setItem('chistory',JSON.stringify(h)).catch(()=>{}); };

  // Build last 7 days chart data
  function getWeeklyData(){
    const days=[];
    const dayNames=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=d.toISOString().split('T')[0];
      const label=['D','L','M','X','J','V','S'][d.getDay()];
      const fullLabel=dayNames[d.getDay()]+' '+d.getDate()+' '+months[d.getMonth()];
      let kcal,prot,carbs,fat;
      if(key===todayKey()){
        kcal=meals.reduce((s,m)=>s+m.kcal,0);
        prot=meals.reduce((s,m)=>s+(m.protein||0),0);
        carbs=meals.reduce((s,m)=>s+(m.carbs||0),0);
        fat=meals.reduce((s,m)=>s+(m.fat||0),0);
      } else {
        const entries=history.filter(e=>e.date===key);
        kcal=entries.reduce((s,e)=>s+e.totalKcal,0);
        prot=entries.reduce((s,e)=>s+(e.totalP||0),0);
        carbs=entries.reduce((s,e)=>s+(e.totalC||0),0);
        fat=entries.reduce((s,e)=>s+(e.totalG||0),0);
      }
      days.push({key,label,fullLabel,kcal,prot:Math.round(prot),carbs:Math.round(carbs),fat:Math.round(fat),isToday:key===todayKey()});
    }
    return days;
  }

  function closeDay(){
    if(meals.length===0){ showAlert(t.noMeals, t.noMealsMsg); return; }
    showAlert(
      t.closeRegister,
      t.closeRegisterQ,
      [
        { text:t.cancel },
        { text:t.closeDayBtn, style:'confirm', onPress:()=>{
          const now = new Date();
          const id = todayKey()+'-'+now.getTime();
          const closedAt = now.getTime();
          const entry = {
            id,
            date: todayKey(),
            label: formatDate(lang)+' '+now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),
            meals: [...meals],
            totalKcal: meals.reduce((s,m)=>s+m.kcal,0),
            totalP: meals.reduce((s,m)=>s+(m.protein||0),0),
            totalC: meals.reduce((s,m)=>s+(m.carbs||0),0),
            totalG: meals.reduce((s,m)=>s+(m.fat||0),0),
            goal: calcGoal(profile),
            mode: profile.mode,
            closedAt,
          };
          const newHistory=[entry,...history];
          setHistory(newHistory); saveHistory(newHistory);
          setMeals([]); saveMeals([]);
          showAlert(t.saved, t.savedMsg);
        }}
      ]
    );
  }

  function openEditMeal(idx){
    const m=meals[idx];
    setEditMealIdx(idx);
    setEditMealData({name:m.name,desc:m.desc||'',emoji:m.emoji||'🍽️',correction:'',analyzing:false,mealType:m.mealType||'breakfast'});
    setShowEditMeal(true);
  }

  async function saveEditMealAI(){
    const text=editMealData.correction?.trim();
    if(!text){ showAlert('Escribe algo','Describe el alimento o receta corregida.'); return; }
    setEditMealData(prev=>({...prev,analyzing:true}));
    const langInstr3=lang==='en'?'Respond in English':'Responde en español';
    const prompt=`${langInstr3}. Analyze this food/recipe and return ONLY JSON with no extra text:\n${text}\nFormat: {"name":"name (max 40 chars)","desc":"ingredients (max 60 chars)","emoji":"emoji","kcal":number,"protein":grams,"carbs":grams,"fat":grams,"portion":"portion"}`;
    try{
      const raw=await callAnthropic({model:'claude-sonnet-4-20250514',max_tokens:400,messages:[{role:'user',content:prompt}]});
      const data=JSON.parse(raw);
      const meal=JSON.parse(data.content.map(b=>b.text||'').join('').replace(/```json|```/gi,'').trim());
      const updated=[...meals];
      const mt=MEAL_TYPES.find(t=>t.id===editMealData.mealType)||MEAL_TYPES[0];
      updated[editMealIdx]={
        ...updated[editMealIdx],
        name:meal.name, desc:meal.desc, emoji:meal.emoji,
        kcal:meal.kcal, protein:meal.protein, carbs:meal.carbs, fat:meal.fat, portion:meal.portion,
        mealType:editMealData.mealType, mealTypeLabel:mt.label, mealTypeIcon:mt.icon,
      };
      setMeals(updated); saveMeals(updated);
      setShowEditMeal(false); setEditMealIdx(null);
      setEditMealData({});
    }catch(err){
      setEditMealData(prev=>({...prev,analyzing:false}));
      showAlert('Error','No se pudo recalcular: '+err.message);
    }
  }

  function isEditable(entry){
    if(!entry.closedAt) return false;
    return (Date.now()-entry.closedAt) < 24*60*60*1000;
  }

  function openEditEntry(idx){
    setEditingEntryIdx(idx);
    setShowHistory(false);
    setTimeout(()=>openAdd(),300);
  }

  function deleteHistoryEntry(idx){
    showAlert(t.deleteEntry2, t.deleteEntryQ,[
      {text:t.cancel},
      {text:t.delete,style:'destructive',onPress:()=>{
        const h=history.filter((_,i)=>i!==idx);
        setHistory(h); saveHistory(h);
      }}
    ]);
  }

  const goal=calcGoal(profile);
  const mode=MODES.find(m=>m.id===profile.mode)||MODES[2];
  const totalKcal=meals.reduce((s,m)=>s+m.kcal,0);
  const totalP=meals.reduce((s,m)=>s+(m.protein||0),0);
  const totalC=meals.reduce((s,m)=>s+(m.carbs||0),0);
  const totalG=meals.reduce((s,m)=>s+(m.fat||0),0);
  const macroGoals=calcMacros(goal,profile.weight||70);
  const remain=goal-totalKcal;

  function openSettings(){
    setFSex(profile.sex||'m');
    setFAge(profile.age?String(profile.age):'');
    setFWeight(profile.weight?String(profile.weight):'');
    setFTargetWeight(profile.targetWeight?String(profile.targetWeight):'');
    setFHeight(profile.height?String(profile.height):'');
    setFActivity(profile.activity||1.55);
    setFMode(profile.mode||'maint');
    setFDevCode(devCode||'');
    setShowSettings(true);
  }

  function saveSettings(){
    const p={sex:fSex,age:parseInt(fAge)||0,weight:parseFloat(fWeight)||0,targetWeight:parseFloat(fTargetWeight)||0,height:parseFloat(fHeight)||0,activity:fActivity,mode:fMode};
    if(fDevCode) { setDevCode(fDevCode); }
    setProfile(p); saveProfile(p);

    setShowSettings(false);
  }

  function deleteMeal(i){ const m=[...meals]; m.splice(i,1); setMeals(m); saveMeals(m); }
  function clearMeals(){ showAlert(t.clearAll, t.clearQ,[{text:t.cancel},{text:t.delete,style:'destructive',onPress:()=>{ setMeals([]); saveMeals([]); }}]); }

  async function pickImage(){
    const { status }=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status!=='granted'){ showAlert('Permiso necesario','Necesitamos acceso a tu galería'); return; }
    const result=await ImagePicker.launchImageLibraryAsync({ mediaTypes:ImagePicker.MediaTypeOptions.Images, base64:false, quality:0.5 });
    if(!result.canceled && result.assets[0]){ analyzeImage(result.assets[0]); }
  }

  async function takePhoto(){
    const { status }=await ImagePicker.requestCameraPermissionsAsync();
    if(status!=='granted'){ showAlert('Permiso necesario','Necesitamos acceso a tu cámara'); return; }
    const result=await ImagePicker.launchCameraAsync({ base64:false, quality:0.5 });
    if(!result.canceled && result.assets[0]){ analyzeImage(result.assets[0]); }
  }

  async function resizeImage(uri){
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return result;
  }

  async function callAnthropic(body, retries=3){
    // Generate a unique userId — dev mode if key starts with sk-ant-dev
    const storedId = await AsyncStorage.getItem('cuserid').catch(()=>null);
    let uid = storedId;
    if(!uid){ uid='user-'+Math.random().toString(36).slice(2,14); AsyncStorage.setItem('cuserid',uid).catch(()=>{}); }
    const userId = isDev ? 'dev-caloriapp' : uid;
    for(let attempt=1; attempt<=retries; attempt++){
      const r = await fetch(BACKEND_URL+'/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({messages: body.messages, userId})
      });
      const raw = await r.text();
      if(r.ok) return raw;
      let msg = 'Error '+r.status;
      try{ msg = JSON.parse(raw).error?.message||msg; }catch(_){ /* keep */ }
      const isOverloaded = r.status===529 || msg.toLowerCase().includes('overload');
      if(isOverloaded && attempt < retries){
        await new Promise(res=>setTimeout(res, 1500*attempt));
        continue;
      }
      throw new Error(msg);
    }
  }

  function incrementAnalyses(){
    const newCount = dailyAnalyses+1;
    setDailyAnalyses(newCount);
    AsyncStorage.setItem('cdaily_analyses',JSON.stringify({date:todayKey(),count:newCount})).catch(()=>{});
  }

  async function analyzeImage(asset){
    if(!isSubscribed && !isDev){ setShowAdd(false); setShowPaywall(true); return; }
    if(!isUnlimited() && dailyAnalyses>=DAILY_LIMIT){
      setAddStep('error');
      setErrorMsg(lang==='en'?`Daily limit reached (${DAILY_LIMIT} analyses). Come back tomorrow! 🌅`:`Límite diario alcanzado (${DAILY_LIMIT} análisis). ¡Vuelve mañana! 🌅`);
      return;
    }
    setAddPrevStep('photo');
    setAddStep('analyzing');
    setPendingImg(asset.uri);
    const resized = await resizeImage(asset.uri);
    const base64 = resized.base64;
    const mt='image/jpeg';
    const lang_=lang;
    const langInstr=lang_==='en'?'Respond in English':'Responde en español';
    const prompt=`${langInstr}. Analyze this food image and return ONLY JSON with no extra text: {"name":"dish name (max 40 chars)","desc":"main ingredients (max 60 chars)","emoji":"emoji","kcal":number,"protein":grams,"carbs":grams,"fat":grams,"portion":"estimated portion"}`;
    try{
      const raw=await callAnthropic({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mt,data:base64}},{type:'text',text:prompt}]}]});
      const data=JSON.parse(raw);
      const txt=data.content.map(b=>b.text||'').join('').replace(/```json|```/gi,'').trim();
      const meal=JSON.parse(txt);
      setPendingMeal(meal); setAddStep('result'); incrementAnalyses();
    }catch(err){ setAddStep('error'); setErrorMsg(err.message||'Error desconocido'); }
  }

  async function analyzeText(){
    if(!recipeText.trim()) return;
    if(!isSubscribed && !isDev){ setShowAdd(false); setShowPaywall(true); return; }
    if(!isUnlimited() && dailyAnalyses>=DAILY_LIMIT){
      setAddStep('error');
      setErrorMsg(lang==='en'?`Daily limit reached (${DAILY_LIMIT} analyses). Come back tomorrow! 🌅`:`Límite diario alcanzado (${DAILY_LIMIT} análisis). ¡Vuelve mañana! 🌅`);
      return;
    }
    setAddPrevStep('text');
    setAddStep('analyzing');
    const langInstr2=lang==='en'?'Respond in English':'Responde en español';
    const prompt=`${langInstr2}. Analyze these ingredients/recipe and return ONLY JSON with no extra text:\n${recipeText}\nFormat: {"name":"dish name (max 40 chars)","desc":"ingredients summary (max 60 chars)","emoji":"emoji","kcal":total number,"protein":total grams,"carbs":total grams,"fat":total grams,"portion":"total amount"}`;
    try{
      const raw=await callAnthropic({model:'claude-sonnet-4-20250514',max_tokens:500,messages:[{role:'user',content:prompt}]});
      const data=JSON.parse(raw);
      const txt=data.content.map(b=>b.text||'').join('').replace(/```json|```/gi,'').trim();
      const meal=JSON.parse(txt);
      setPendingMeal(meal); setAddStep('result'); incrementAnalyses();
    }catch(err){ setAddStep('error'); setErrorMsg(err.message||'Error desconocido'); }
  }

  function confirmMeal(){
    if(!pendingMeal) return;
    const mt=MEAL_TYPES.find(t=>t.id===mealType)||MEAL_TYPES[0];
    const newItem={...pendingMeal,imgSrc:pendingImg,time:timeNow(),mealType:mealType||'breakfast',mealTypeLabel:mt.label,mealTypeIcon:mt.icon};
    if(editingEntryIdx!==null){
      const updated=[...history];
      const entry={...updated[editingEntryIdx]};
      entry.meals=[...entry.meals,newItem];
      entry.totalKcal=entry.meals.reduce((s,m)=>s+m.kcal,0);
      entry.totalP=entry.meals.reduce((s,m)=>s+(m.protein||0),0);
      entry.totalC=entry.meals.reduce((s,m)=>s+(m.carbs||0),0);
      entry.totalG=entry.meals.reduce((s,m)=>s+(m.fat||0),0);
      updated[editingEntryIdx]=entry;
      setHistory(updated); saveHistory(updated);
      setEditingEntryIdx(null);
      setShowAdd(false); resetAdd();
      setShowHistory(true);
    } else {
      const m=[...meals,newItem];
      setMeals(m); saveMeals(m);
      setShowAdd(false); resetAdd();
    }
  }

  function resetAdd(){ setAddStep('upload'); setPendingMeal(null); setPendingImg(null); setErrorMsg(''); setRecipeText(''); setMealType(null); }

  function openAdd(){ resetAdd(); setShowAdd(true); }

  const formProfile={sex:fSex,age:parseInt(fAge)||0,weight:parseFloat(fWeight)||0,activity:fActivity,mode:fMode,height:parseFloat(fHeight)||0};
  const formTDEE=calcTDEE(formProfile);
  const formGoal=calcGoal(formProfile);

  return (
    <View style={{flex:1}}>
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={{paddingHorizontal:24,marginBottom:20}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <Text style={s.logo}><Text style={{color:C.lime,textShadowColor:'rgba(198,241,53,0.6)',textShadowOffset:{width:0,height:0},textShadowRadius:8}}>C</Text>alori<Text style={{color:C.lime,textShadowColor:'rgba(198,241,53,0.6)',textShadowOffset:{width:0,height:0},textShadowRadius:8}}>app</Text></Text>
            <TouchableOpacity style={s.iconBtn} onPress={openSettings}><Text style={{fontSize:16}}>⚙️</Text></TouchableOpacity>
          </View>
          <View style={s.datePill}>
            <Text style={{fontSize:12,color:C.muted}}>
              {formatDate(lang)}{!isUnlimited()&&`  •  ${dailyAnalyses}/${DAILY_LIMIT} 🤖`}
            </Text>
          </View>
        </View>

        {/* MODE BADGE */}
        <TouchableOpacity style={s.modeBadge} onPress={openSettings}>
          <View style={[s.modeDot,{backgroundColor:mode.color}]}/>
          <Text style={{fontSize:13,fontWeight:'500',color:C.text}}>{mode.title} — {goal} kcal/día</Text>
          <Text style={{fontSize:11,color:C.muted,marginLeft:4}}>›</Text>
        </TouchableOpacity>

        {/* RING CARD */}
        <View style={s.ringCard}>
          <Ring total={totalKcal} goal={goal} color={mode.color}/>
          <View style={{flex:1,marginLeft:20}}>
            <Text style={{fontWeight:'700',fontSize:14,color:totalKcal>goal?C.danger:mode.color,marginBottom:12}}>
              {totalKcal>goal?`+${totalKcal-goal} ${t.over}`:`${remain} ${t.remaining}`}
            </Text>
            <MacroBar label={t.protein} value={totalP} max={macroGoals.protein} color={C.lime} onPress={()=>setShowMacroModal('protein')}/>
            <MacroBar label={t.carbs} value={totalC} max={macroGoals.carbs} color={C.orange} onPress={()=>setShowMacroModal('carbs')}/>
            <MacroBar label={t.fat} value={totalG} max={macroGoals.fat} color={C.blue} onPress={()=>setShowMacroModal('fat')}/>
          </View>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          {[{v:meals.length,l:t.meals,c:C.lime},{v:goal,l:t.goal,c:'#a78bfa'},{v:Math.max(0,remain),l:t.left,c:C.blue}].map((x,i)=>(
            <View key={i} style={s.statCard}>
              <Text style={{fontFamily:'System',fontSize:18,fontWeight:'700',color:x.c,marginBottom:4}}>{x.v}</Text>
              <Text style={{fontSize:10,color:C.muted,textTransform:'uppercase',letterSpacing:0.5}}>{x.l}</Text>
            </View>
          ))}
        </View>

        {/* WEIGHT PROGRESS CARD */}
        {profile.weight>0 && profile.targetWeight>0 && (()=>{
          const diff=Math.abs(profile.weight-profile.targetWeight);
          const losing=profile.weight>profile.targetWeight;
          const reached=profile.weight===profile.targetWeight;
          const pct=reached?1:Math.min(1,1-(diff/Math.max(profile.weight,profile.targetWeight)));
          return (
            <View style={{marginHorizontal:24,marginBottom:16,backgroundColor:C.surface,borderRadius:20,padding:20,borderWidth:1,borderColor:C.border}}>
              {reached?(
                <View style={{alignItems:'center'}}>
                  <Text style={{fontSize:28,marginBottom:6}}>🎉</Text>
                  <Text style={{fontSize:20,fontWeight:'800',color:C.lime,letterSpacing:-0.5}}>{t.goalReached}</Text>
                  <Text style={{fontSize:13,color:C.muted,marginTop:4}}>{profile.weight} kg · meta {profile.targetWeight} kg</Text>
                </View>
              ):(
                <>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                    <View>
                      <Text style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:0.8,marginBottom:4}}>
                        {losing?t.tolose:t.togain}
                      </Text>
                      <Text style={{fontSize:42,fontWeight:'800',fontStyle:'italic',letterSpacing:1,lineHeight:46,color:C.text,textShadowColor:'rgba(240,242,245,0.15)',textShadowOffset:{width:1,height:2},textShadowRadius:4}}>
                        <Text style={{color:C.lime,textShadowColor:'rgba(198,241,53,0.6)',textShadowOffset:{width:0,height:0},textShadowRadius:8}}>{diff.toFixed(1)}</Text>
                        <Text style={{fontSize:18,fontWeight:'500',fontStyle:'italic',color:C.muted,textShadowColor:'transparent'}}> kg</Text>
                      </Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <View style={{flexDirection:'row',gap:16}}>
                        <View style={{alignItems:'center'}}>
                          <Text style={{fontSize:11,color:C.muted,marginBottom:2}}>{t.weightActual}</Text>
                          <Text style={{fontSize:18,fontWeight:'700',color:C.text}}>{profile.weight}<Text style={{fontSize:11,color:C.muted}}> kg</Text></Text>
                        </View>
                        <View style={{alignItems:'center'}}>
                          <Text style={{fontSize:11,color:C.muted,marginBottom:2}}>{t.weightGoal}</Text>
                          <Text style={{fontSize:18,fontWeight:'700',color:C.lime}}>{profile.targetWeight}<Text style={{fontSize:11,color:C.muted}}> kg</Text></Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={{height:6,backgroundColor:C.card,borderRadius:99,overflow:'hidden'}}>
                    <View style={{height:6,width:`${Math.max(4,Math.round(pct*100))}%`,backgroundColor:C.lime,borderRadius:99}}/>
                  </View>
                  <Text style={{fontSize:11,color:C.muted,marginTop:8,textAlign:'right'}}>
                    {losing?t.reduce:t.increase} {diff.toFixed(1)} {t.weightToReach} {profile.targetWeight} kg
                  </Text>
                </>
              )}
            </View>
          );
        })()}

        {/* LOG */}
        <View style={{paddingHorizontal:24}}>
          <View style={{marginBottom:16}}>
            <Text style={{fontSize:16,fontWeight:'700',color:C.text,marginBottom:10}}>{t.logTitle}</Text>
            <View style={{flexDirection:'row',gap:8}}>
              <TouchableOpacity onPress={openHistory} style={{flex:1,backgroundColor:C.card,borderRadius:10,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:C.border}}>
                <Text style={{fontSize:12,color:C.blue}}>{t.history}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeDay} style={{flex:1,backgroundColor:C.card,borderRadius:10,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:C.lime}}>
                <Text style={{fontSize:12,color:C.lime}}>{t.closeDay}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearMeals} style={{flex:1,backgroundColor:C.card,borderRadius:10,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:C.border}}>
                <Text style={{fontSize:12,color:C.muted}}>{t.clear}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {meals.length===0?(
            <View style={{alignItems:'center',paddingVertical:48}}>
              <Text style={{fontSize:48,marginBottom:12}}>🍽️</Text>
              <Text style={{fontSize:14,color:C.muted,textAlign:'center',lineHeight:22}}>Aún no has registrado nada hoy.{'\n'}Añade tu primera comida.</Text>
            </View>
          ):(
            [...meals].reverse().map((m,ri)=>{
              const i=meals.length-1-ri;
              return (
                <TouchableOpacity key={i} style={s.mealCard} onPress={()=>setSelectedMeal(m)} activeOpacity={0.8}>
                  {m.imgSrc
                    ? <Image source={{uri:m.imgSrc}} style={s.mealImg}/>
                    : <View style={s.mealImgPh}><Text style={{fontSize:28}}>{m.emoji||'🍽️'}</Text></View>
                  }
                  <View style={{flex:1,padding:14,justifyContent:'space-between'}}>
                    <View>
                      <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:3}}>
                        {m.mealTypeIcon&&<Text style={{fontSize:12}}>{m.mealTypeIcon}</Text>}
                        {m.mealTypeLabel&&<Text style={{fontSize:10,color:C.muted}}>{m.mealTypeLabel}</Text>}
                      </View>
                      <Text style={{fontSize:14,fontWeight:'700',color:C.text,marginBottom:2}}>{m.name}</Text>
                      <Text style={{fontSize:12,color:C.muted}}>{m.desc}</Text>
                    </View>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                      <Text style={{fontSize:20,fontWeight:'800',color:C.lime}}>{m.kcal}<Text style={{fontSize:11,color:C.muted,fontWeight:'400'}}> kcal</Text></Text>
                      <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                        <Text style={{fontSize:11,color:C.muted}}>{m.time}</Text>
                        <TouchableOpacity onPress={(e)=>{e.stopPropagation();openEditMeal(i);}} style={{padding:6}}>
                          <Text style={{color:C.blue,fontSize:13}}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e)=>{e.stopPropagation();deleteMeal(i);}} style={{padding:6}}>
                          <Text style={{color:C.muted,fontSize:14}}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{height:100}}/>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.85}>
        <Text style={{fontSize:18,marginRight:8}}>📷</Text>
        <Text style={{fontSize:16,fontWeight:'700',color:'#0d0f14'}}>{t.addMeal}</Text>
      </TouchableOpacity>

      {/* ── ADD MODAL ─────────────────────────────────────── */}
      <Modal visible={showAdd} animationType="slide" transparent={false} onRequestClose={()=>{setShowAdd(false);resetAdd();setEditingEntryIdx(null);}} hardwareAccelerated={true}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1,backgroundColor:C.surface}}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{flex:1,padding:24,paddingTop:Platform.OS==='ios'?60:40}} onStartShouldSetResponder={()=>true}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <View style={{width:40,height:4,backgroundColor:C.border,borderRadius:99}}/>
                <TouchableOpacity onPress={()=>{setShowAdd(false);resetAdd();setEditingEntryIdx(null);}}>
                  <Text style={{fontSize:14,color:C.muted}}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {addStep==='upload' && (
                <>
                  {editingEntryIdx!==null && (
                    <View style={{backgroundColor:'rgba(198,241,53,0.08)',borderWidth:1,borderColor:C.lime,borderRadius:12,padding:12,marginBottom:14,flexDirection:'row',alignItems:'center',gap:8}}>
                      <Text style={{fontSize:16}}>✏️</Text>
                      <Text style={{fontSize:12,color:C.lime,flex:1,lineHeight:18}}>{t.editingClosed}</Text>
                    </View>
                  )}
                  <Text style={s.sheetTitle}>{t.whatDidYouEat}</Text>
                  <Text style={{fontSize:13,color:C.muted,marginBottom:10}}>{t.mealType}</Text>
                  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18}}>
                    {MEAL_TYPES.map(t=>(
                      <TouchableOpacity key={t.id} onPress={()=>setMealType(t.id)}
                        style={{width:'30%',alignItems:'center',paddingVertical:10,borderRadius:14,borderWidth:1.5,borderColor:mealType===t.id?C.lime:C.border,backgroundColor:mealType===t.id?'rgba(198,241,53,0.1)':C.card}}>
                        <Text style={{fontSize:22,marginBottom:4}}>{t.icon}</Text>
                        <Text style={{fontSize:12,color:mealType===t.id?C.lime:C.muted,fontWeight:mealType===t.id?'700':'400'}}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.tabRow}>
                    <TouchableOpacity style={[s.tabBtn,addTab==='photo'&&s.tabOn]} onPress={()=>setAddTab('photo')}>
                      <Text style={{color:addTab==='photo'?'#0d0f14':C.muted,fontWeight:'600',fontSize:14}}>{t.photo}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.tabBtn,addTab==='text'&&s.tabOn]} onPress={()=>setAddTab('text')}>
                      <Text style={{color:addTab==='text'?'#0d0f14':C.muted,fontWeight:'600',fontSize:14}}>{t.describe}</Text>
                    </TouchableOpacity>
                  </View>

                  {addTab==='photo'?(
                    <>
                      <Text style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:20}}>{t.photoHint}</Text>
                      <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
                        <Text style={{fontSize:32,marginBottom:6}}>📸</Text>
                        <Text style={{fontSize:14,color:C.lime,fontWeight:'600'}}>{t.takePhoto}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.photoBtn,{marginTop:10}]} onPress={pickImage}>
                        <Text style={{fontSize:32,marginBottom:6}}>🖼️</Text>
                        <Text style={{fontSize:14,color:C.lime,fontWeight:'600'}}>{t.fromGallery}</Text>
                      </TouchableOpacity>
                    </>
                  ):(
                    <>
                      <Text style={{fontSize:13,color:C.muted,marginBottom:12,lineHeight:20}}>{t.textHint}</Text>
                      <TextInput
                        style={s.textarea}
                        multiline
                        numberOfLines={5}
                        placeholder={t.textPlaceholder}
                        placeholderTextColor={C.muted}
                        value={recipeText}
                        onChangeText={setRecipeText}
                        textAlignVertical="top"
                      />
                      <TouchableOpacity style={[s.confirmBtn,{marginTop:12}]} onPress={analyzeText}>
                        <Text style={{fontSize:15,fontWeight:'700',color:'#0d0f14'}}>{t.calcCalories}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity style={s.cancelBtn} onPress={()=>{setShowAdd(false);resetAdd();setEditingEntryIdx(null);if(editingEntryIdx!==null)setTimeout(()=>setShowHistory(true),300);}}>
                    <Text style={{fontSize:14,color:C.muted}}>{t.cancel}</Text>
                  </TouchableOpacity>
                </>
              )}

              {addStep==='analyzing' && (
                <>
                  <Text style={s.sheetTitle}>{t.analyzing}</Text>
                  <View style={{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:16,padding:20,gap:16}}>
                    <ActivityIndicator color={C.lime} size="large"/>
                    <View>
                      <Text style={{fontSize:15,fontWeight:'700',color:C.text,marginBottom:4}}>{t.processing}</Text>
                      <Text style={{fontSize:13,color:C.muted}}>{t.estimating}</Text>
                    </View>
                  </View>
                </>
              )}

              {addStep==='result' && pendingMeal && (
                <>
                  <Text style={s.sheetTitle}>{t.identified}</Text>
                  <Text style={{fontSize:13,color:C.muted,marginBottom:16}}>{t.reviewNutri}</Text>
                  <View style={{backgroundColor:C.card,borderWidth:1,borderColor:C.lime,borderRadius:20,padding:20,marginBottom:16}}>
                    <View style={{flexDirection:'row',gap:14,alignItems:'flex-start',marginBottom:14}}>
                      {pendingImg
                        ? <Image source={{uri:pendingImg}} style={{width:72,height:72,borderRadius:14}}/>
                        : <Text style={{fontSize:40}}>{pendingMeal.emoji||'🍽️'}</Text>
                      }
                      <View style={{flex:1}}>
                        <Text style={{fontSize:16,fontWeight:'700',color:C.text,marginBottom:4}}>{pendingMeal.emoji} {pendingMeal.name}</Text>
                        <Text style={{fontSize:12,color:C.muted,marginBottom:4}}>{pendingMeal.desc}</Text>
                        <Text style={{fontSize:11,color:C.muted}}>{pendingMeal.portion}</Text>
                      </View>
                    </View>
                    <View style={{flexDirection:'row',gap:8}}>
                      {[{v:Math.round(pendingMeal.kcal),l:'kcal',c:C.lime},{v:Math.round(pendingMeal.protein)+'g',l:'prot',c:C.lime},{v:Math.round(pendingMeal.carbs)+'g',l:'carbos',c:C.orange},{v:Math.round(pendingMeal.fat)+'g',l:'grasa',c:C.blue}].map((x,i)=>(
                        <View key={i} style={{flex:1,backgroundColor:C.surface,borderRadius:12,padding:10,alignItems:'center'}}>
                          <Text style={{fontSize:15,fontWeight:'700',color:x.c,marginBottom:2}}>{x.v}</Text>
                          <Text style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>{x.l}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity style={s.confirmBtn} onPress={confirmMeal}>
                    <Text style={{fontSize:15,fontWeight:'700',color:'#0d0f14'}}>{t.addToLog}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={resetAdd}>
                    <Text style={{fontSize:14,color:C.muted}}>{t.analyzeOther}</Text>
                  </TouchableOpacity>
                </>
              )}

              {addStep==='error' && (
                <>
                  <Text style={s.sheetTitle}>{t.somethingFailed}</Text>
                  <Text style={{fontSize:13,color:C.muted,marginBottom:16}}>{t.couldNotAnalyze}</Text>
                  <View style={{backgroundColor:'rgba(255,92,92,0.1)',borderWidth:1,borderColor:'rgba(255,92,92,0.3)',borderRadius:12,padding:14,marginBottom:16}}>
                    <Text style={{fontSize:13,color:C.danger}}>{errorMsg}</Text>
                  </View>
                  <TouchableOpacity style={s.confirmBtn} onPress={()=>{
                    setAddStep('upload');
                    setErrorMsg('');
                    setAddTab(addPrevStep);
                  }}>
                    <Text style={{fontSize:15,fontWeight:'700',color:'#0d0f14'}}>{t.retry}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={resetAdd}>
                    <Text style={{fontSize:14,color:C.muted}}>{t.cancel}</Text>
                  </TouchableOpacity>
                </>
              )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── HISTORY PANEL — Animated, no Modal para no bloquear alerts ── */}
      {showHistory && (
        <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:50}}>
          <TouchableWithoutFeedback onPress={closeHistory}>
            <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.6)'}}/>
          </TouchableWithoutFeedback>
          <Animated.View style={[s.sheet,{position:'absolute',bottom:0,left:0,right:0,height:'92%',transform:[{translateY:slideAnim}]}]}>
            <TouchableOpacity activeOpacity={1} onPress={closeHistory} style={{alignItems:'center',paddingBottom:4}}>
              <View style={s.handle}/>
            </TouchableOpacity>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <Text style={s.sheetTitle}>{t.historyTitle}</Text>
              <TouchableOpacity onPress={closeHistory}>
                <Text style={{fontSize:14,color:C.muted}}>{t.close}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true} bounces={true} contentContainerStyle={{paddingBottom:48}} style={{flex:1}}>
              {history.length===0?(
                <View style={{alignItems:'center',paddingVertical:48}}>
                  <Text style={{fontSize:40,marginBottom:12}}>📋</Text>
                  <Text style={{fontSize:14,color:C.muted,textAlign:'center',lineHeight:22}}>{t.noHistory.split('\n')[0]}{'\n'}Cierra tu primer día para verlo aquí.</Text>
                </View>
              ):(
                history.map((entry,i)=>{
                  const mode=MODES.find(m=>m.id===entry.mode)||MODES[2];
                  const pct=Math.min(1,entry.totalKcal/entry.goal);
                  const over=entry.totalKcal>entry.goal;
                  const isExpanded = expandedEntry===i;
                  return (
                    <View key={i} style={{backgroundColor:C.card,borderRadius:18,marginBottom:12,borderWidth:1,borderColor:isExpanded?mode.color:C.border,overflow:'hidden'}}>
                      {/* HEADER — toca para expandir */}
                      <TouchableOpacity onPress={()=>setExpandedEntry(isExpanded?null:i)} activeOpacity={0.8} style={{padding:18}}>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                          <View style={{flex:1}}>
                            <Text style={{fontSize:15,fontWeight:'700',color:C.text,marginBottom:2}}>{entry.label}</Text>
                            <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
                              <View style={{width:6,height:6,borderRadius:3,backgroundColor:mode.color}}/>
                              <Text style={{fontSize:11,color:C.muted}}>{mode.title}</Text>
                              <Text style={{fontSize:11,color:C.muted}}>· {entry.meals.length} comidas</Text>
                            </View>
                          </View>
                          <View style={{alignItems:'flex-end'}}>
                            <Text style={{fontSize:22,fontWeight:'800',color:over?C.danger:mode.color}}>{entry.totalKcal}</Text>
                            <Text style={{fontSize:10,color:C.muted}}>de {entry.goal} kcal</Text>
                          </View>
                        </View>
                        <View style={{height:4,backgroundColor:C.surface,borderRadius:99,marginBottom:10,overflow:'hidden'}}>
                          <View style={{height:4,width:`${Math.min(100,pct*100)}%`,backgroundColor:over?C.danger:mode.color,borderRadius:99}}/>
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                          {[{l:'Prot',v:Math.round(entry.totalP)+'g',c:C.lime},{l:'Carbos',v:Math.round(entry.totalC)+'g',c:C.orange},{l:'Grasa',v:Math.round(entry.totalG)+'g',c:C.blue}].map((x,j)=>(
                            <View key={j} style={{alignItems:'center'}}>
                              <Text style={{fontSize:13,fontWeight:'700',color:x.c}}>{x.v}</Text>
                              <Text style={{fontSize:10,color:C.muted}}>{x.l}</Text>
                            </View>
                          ))}
                          <View style={{alignItems:'center'}}>
                            <Text style={{fontSize:13,color:C.muted}}>{isExpanded?'▲':'▼'}</Text>
                            <Text style={{fontSize:10,color:C.muted}}>{isExpanded?'cerrar':'ver'}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* DETALLE — visible solo si expandido */}
                      {isExpanded && (
                        <View style={{borderTopWidth:1,borderTopColor:C.border,paddingHorizontal:18,paddingBottom:18}}>
                          <Text style={{fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:0.6,marginTop:14,marginBottom:10}}>{t.foodList}</Text>
                          {entry.meals.map((m,mi)=>(
                            <TouchableOpacity key={mi} onPress={()=>setSelectedMeal(m)} activeOpacity={0.7}
                              style={{paddingVertical:8,borderBottomWidth:mi<entry.meals.length-1?1:0,borderBottomColor:C.surface}}>
                              <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                                {m.imgSrc
                                  ? <Image source={{uri:m.imgSrc}} style={{width:38,height:38,borderRadius:10,flexShrink:0}}/>
                                  : <View style={{width:38,height:38,borderRadius:10,backgroundColor:C.surface,alignItems:'center',justifyContent:'center',flexShrink:0}}><Text style={{fontSize:22}}>{m.emoji||'🍽️'}</Text></View>
                                }
                                <View style={{flex:1}}>
                                  <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                                    {m.mealTypeIcon&&<Text style={{fontSize:11}}>{m.mealTypeIcon}</Text>}
                                    <Text style={{fontSize:13,fontWeight:'600',color:C.text,flexShrink:1}} numberOfLines={2}>{m.name}</Text>
                                  </View>
                                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:2}}>
                                    <Text style={{fontSize:11,color:C.muted}}>{m.time}{m.mealTypeLabel?' · '+m.mealTypeLabel:''}</Text>
                                    <Text style={{fontSize:13,fontWeight:'700',color:mode.color,marginLeft:8}}>{'  '}{m.kcal} kcal ›</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:14}}>
                            {isEditable(entry)?(
                              <TouchableOpacity onPress={()=>openEditEntry(i)} style={{backgroundColor:'rgba(198,241,53,0.1)',borderWidth:1,borderColor:C.lime,borderRadius:10,paddingVertical:6,paddingHorizontal:14}}>
                                <Text style={{fontSize:12,color:C.lime,fontWeight:'600'}}>{t.addFood}</Text>
                              </TouchableOpacity>
                            ):(
                              <Text style={{fontSize:11,color:C.muted}}>{t.editClosed}</Text>
                            )}
                            <TouchableOpacity onPress={()=>deleteHistoryEntry(i)}>
                              <Text style={{fontSize:11,color:C.muted}}>{t.deleteEntry}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* ── SETTINGS MODAL ─────────────────────────────────── */}
      <Modal visible={showSettings} animationType="slide" transparent onRequestClose={()=>setShowSettings(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={()=>setShowSettings(false)}>
          <View style={[s.sheet,{maxHeight:'95%'}]} onStartShouldSetResponder={()=>true} onTouchEnd={e=>e.stopPropagation()}>
            <TouchableOpacity activeOpacity={1} onPress={()=>setShowSettings(false)} style={{alignItems:'center',paddingBottom:4}}>
              <View style={s.handle}/>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.sheetTitle}>{t.profileTitle}</Text>
              <Text style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:20}}>{t.profileSub}</Text>



              {/* DATOS */}
              <Text style={s.secTitle}>{t.personalData}</Text>
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>{t.sex}</Text>
                <View style={{flexDirection:'row',gap:8}}>
                  {['m','f'].map(v=>(
                    <TouchableOpacity key={v} style={[s.pill,fSex===v&&{backgroundColor:C.lime}]} onPress={()=>setFSex(v)}>
                      <Text style={{fontSize:13,fontWeight:'600',color:fSex===v?'#0d0f14':C.muted}}>{v==='m'?t.male:t.female}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {[{l:t.age,v:fAge,s:setFAge,p:'25'},{l:t.currentWeight,v:fWeight,s:setFWeight,p:'70'},{l:t.targetWeight,v:fTargetWeight,s:setFTargetWeight,p:'65'},{l:t.height,v:fHeight,s:setFHeight,p:'175'}].map((f,i)=>(
                <View key={i} style={s.fieldRow}>
                  <Text style={s.fieldLabel}>{f.l}</Text>
                  <TextInput style={[s.input,{width:90,textAlign:'right'}]} keyboardType="numeric" placeholder={f.p} placeholderTextColor={C.muted} value={f.v} onChangeText={f.s}/>
                </View>
              ))}

              {/* ACTIVIDAD */}
              <Text style={s.secTitle}>{t.activity}</Text>
              <View style={{backgroundColor:C.card,borderRadius:14,padding:8,marginBottom:20}}>
                {ACTIVITY.map(a=>(
                  <TouchableOpacity key={a.value} style={[{padding:12,borderRadius:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},fActivity===a.value&&{backgroundColor:C.surface}]} onPress={()=>setFActivity(a.value)}>
                    <Text style={{fontSize:14,color:fActivity===a.value?C.text:C.muted}}>{a.label}</Text>
                    {fActivity===a.value && <Text style={{color:C.lime}}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              {/* TDEE */}
              {formProfile.weight>0 && formProfile.height>0 && formProfile.age>0 && (
                <View style={{backgroundColor:C.card,borderRadius:14,padding:16,marginBottom:20,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <View>
                    <Text style={{fontSize:12,color:C.muted,marginBottom:4}}>{t.tdeeLabel}</Text>
                    <Text style={{fontSize:24,fontWeight:'800',color:C.lime}}>{formTDEE} kcal</Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={{fontSize:12,color:C.muted,marginBottom:4}}>{t.currentGoal}</Text>
                    <Text style={{fontSize:18,fontWeight:'700',color:MODES.find(m=>m.id===fMode)?.color||C.text}}>{formGoal} kcal</Text>
                  </View>
                </View>
              )}

              {/* MODOS */}
              <Text style={s.secTitle}>{t.chooseMode}</Text>
              {MODES.map(m=>{
                const kcal=formProfile.weight>0&&formProfile.height>0&&formProfile.age>0?Math.max(1000,formTDEE+m.delta):null;
                const sel=fMode===m.id;
                let weeks='';
                const tw=parseFloat(fTargetWeight);
                const cw=parseFloat(fWeight);
                if(tw>0&&cw>0&&tw!==cw&&m.delta!==0){
                  const goingDown=tw<cw;
                  if((goingDown&&m.delta<0)||(!goingDown&&m.delta>0)){
                    weeks=` · ~${Math.round((Math.abs(tw-cw)*7700)/(Math.abs(m.delta)*7))} sem`;
                  }
                }
                return (
                  <TouchableOpacity key={m.id} style={[s.modeCard,sel&&{borderColor:m.color,backgroundColor:'rgba(0,0,0,0.2)'}]} onPress={()=>setFMode(m.id)}>
                    <View style={{width:42,height:42,borderRadius:12,backgroundColor:sel?m.color+'22':'rgba(255,255,255,0.05)',alignItems:'center',justifyContent:'center',marginRight:12}}>
                      <Text style={{fontSize:20}}>{m.icon}</Text>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={{fontSize:14,fontWeight:'700',color:sel?m.color:C.text,marginBottom:2}}>{m.title}</Text>
                      <Text style={{fontSize:11,color:C.muted}}>{m.sub}</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <Text style={{fontSize:13,fontWeight:'700',color:m.color}}>{kcal?kcal:m.delta===0?'=':m.delta>0?'+'+m.delta:m.delta}</Text>
                      <Text style={{fontSize:10,color:C.muted}}>{kcal?'kcal/día'+weeks:'kcal'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}


              {/* LANGUAGE */}
              <View style={{marginBottom:20}}>
                <Text style={s.secTitle}>{t.language}</Text>
                <View style={{flexDirection:'row',gap:8}}>
                  {['es','en'].map(l=>(
                    <TouchableOpacity key={l} onPress={()=>{setLang(l);AsyncStorage.setItem('clang',l).catch(()=>{});}}
                      style={{flex:1,backgroundColor:lang===l?C.lime+'22':C.card,borderRadius:14,padding:14,alignItems:'center',borderWidth:1.5,borderColor:lang===l?C.lime:C.border}}>
                      <Text style={{fontSize:20,marginBottom:4}}>{l==='es'?'🇪🇸':'🇬🇧'}</Text>
                      <Text style={{fontSize:13,fontWeight:'700',color:lang===l?C.lime:C.muted}}>{l==='es'?'Español':'English'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* DEV CODE */}
              <View style={{marginBottom:20}}>
                <Text style={s.secTitle}>{lang==='en'?'Developer':'Desarrollador'}</Text>
                <Text style={{fontSize:13,color:C.muted,marginBottom:10}}>{lang==='en'?'Code':'Código'}</Text>
                <TextInput
                  style={s.input}
                  value={fDevCode}
                  onChangeText={setFDevCode}
                  placeholder={lang==='en'?'Enter dev code':'Introduce el código'}
                  placeholderTextColor={C.muted}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {isDev&&<Text style={{fontSize:11,color:C.lime,marginTop:8}}>✓ {lang==='en'?'Developer mode active — unlimited':'Modo desarrollador activo — sin límites'}</Text>}
              </View>

              <TouchableOpacity style={s.confirmBtn} onPress={saveSettings}>
                <Text style={{fontSize:15,fontWeight:'700',color:'#0d0f14'}}>{t.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowSettings(false)}>
                <Text style={{fontSize:14,color:C.muted}}>{t.cancel}</Text>
              </TouchableOpacity>
              <View style={{height:32}}/>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MEAL DETAIL MODAL ─────────────────────────────── */}
      {selectedMeal && (
        <Modal visible={true} animationType="fade" transparent onRequestClose={()=>setSelectedMeal(null)}>
          <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.78)',justifyContent:'center',alignItems:'center',padding:28}} activeOpacity={1} onPress={()=>setSelectedMeal(null)}>
            <TouchableWithoutFeedback onPress={e=>e.stopPropagation()}>
              <View style={{backgroundColor:C.surface,borderRadius:24,padding:24,width:'100%',borderWidth:1,borderColor:C.border}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:14,marginBottom:20}}>
                  {selectedMeal.imgSrc
                    ? <Image source={{uri:selectedMeal.imgSrc}} style={{width:64,height:64,borderRadius:14}}/>
                    : <View style={{width:64,height:64,borderRadius:14,backgroundColor:C.card,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:36}}>{selectedMeal.emoji||'🍽️'}</Text></View>
                  }
                  <View style={{flex:1}}>
                    {selectedMeal.mealTypeIcon&&(
                      <View style={{flexDirection:'row',alignItems:'center',gap:4,marginBottom:4}}>
                        <Text style={{fontSize:12}}>{selectedMeal.mealTypeIcon}</Text>
                        <Text style={{fontSize:11,color:C.muted}}>{selectedMeal.mealTypeLabel}</Text>
                      </View>
                    )}
                    <Text style={{fontSize:17,fontWeight:'700',color:C.text,marginBottom:2}}>{selectedMeal.name}</Text>
                    <Text style={{fontSize:12,color:C.muted,lineHeight:18}}>{selectedMeal.desc}</Text>
                  </View>
                </View>
                {selectedMeal.portion&&(
                  <View style={{backgroundColor:C.card,borderRadius:10,padding:10,marginBottom:16}}>
                    <Text style={{fontSize:12,color:C.muted}}>{t.portion+': '+selectedMeal.portion}</Text>
                  </View>
                )}
                <View style={{flexDirection:'row',gap:6,marginBottom:20}}>
                  {[
                    {v:selectedMeal.kcal,l:t.kcal,c:C.lime},
                    {v:Math.round(selectedMeal.protein||0)+'g',l:t.protein,c:C.lime},
                    {v:Math.round(selectedMeal.carbs||0)+'g',l:t.carbs,c:C.orange},
                    {v:Math.round(selectedMeal.fat||0)+'g',l:t.fat,c:C.blue},
                  ].map((x,i)=>(
                    <View key={i} style={{flex:1,backgroundColor:C.card,borderRadius:12,paddingVertical:10,paddingHorizontal:4,alignItems:'center'}}>
                      <Text style={{fontSize:15,fontWeight:'800',color:x.c,marginBottom:3}}>{x.v}</Text>
                      <Text style={{fontSize:9,color:C.muted,textTransform:'uppercase',textAlign:'center',letterSpacing:0.3}} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{x.l}</Text>
                    </View>
                  ))}
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={{fontSize:11,color:C.muted}}>{selectedMeal.time||''}</Text>
                  <TouchableOpacity onPress={()=>setSelectedMeal(null)} style={{backgroundColor:C.card,borderRadius:12,paddingVertical:10,paddingHorizontal:24,borderWidth:1,borderColor:C.border}}>
                    <Text style={{fontSize:14,color:C.text,fontWeight:'600'}}>{t.close}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── EDIT MEAL MODAL ─────────────────────────────────── */}
      <Modal visible={showEditMeal} animationType="slide" transparent={false} onRequestClose={()=>setShowEditMeal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1,backgroundColor:C.surface}}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{flex:1,padding:24,paddingTop:Platform.OS==='ios'?60:40}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <Text style={s.sheetTitle}>{t.editMeal}</Text>
                <TouchableOpacity onPress={()=>setShowEditMeal(false)}>
                  <Text style={{fontSize:14,color:C.muted}}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:20}}>{t.editMealSub}</Text>
                <Text style={{fontSize:12,color:C.muted,marginBottom:8}}>{t.currentFood}</Text>
                <View style={{backgroundColor:C.card,borderRadius:12,padding:12,marginBottom:16,flexDirection:'row',alignItems:'center',gap:10}}>
                  <Text style={{fontSize:20}}>{editMealData.emoji||'🍽️'}</Text>
                  <Text style={{fontSize:13,color:C.muted,flex:1}}>{editMealData.name}</Text>
                </View>
                <Text style={{fontSize:12,color:C.muted,marginBottom:8}}>{t.mealType}</Text>
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>
                  {MEAL_TYPES.map(mt=>(
                    <TouchableOpacity key={mt.id}
                      onPress={()=>setEditMealData(prev=>({...prev,mealType:mt.id}))}
                      style={{flexDirection:'row',alignItems:'center',gap:6,paddingVertical:8,paddingHorizontal:12,borderRadius:12,borderWidth:1.5,
                        borderColor:editMealData.mealType===mt.id?C.lime:C.border,
                        backgroundColor:editMealData.mealType===mt.id?'rgba(198,241,53,0.1)':C.card}}>
                      <Text style={{fontSize:14}}>{mt.icon}</Text>
                      <Text style={{fontSize:12,color:editMealData.mealType===mt.id?C.lime:C.muted,fontWeight:editMealData.mealType===mt.id?'700':'400'}}>{mt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{fontSize:12,color:C.muted,marginBottom:8}}>{t.correction}</Text>
                <TextInput
                  style={{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,color:C.text,fontSize:14,padding:14,minHeight:100,textAlignVertical:'top',lineHeight:22}}
                  multiline
                  scrollEnabled={false}
                  placeholder={lang==='en'?`E.g.: ${editMealData.name||'describe the corrected food with quantities'}`:`Ej: ${editMealData.name||'describe el alimento corregido con cantidades'}`}
                  placeholderTextColor={C.muted}
                  value={editMealData.correction||''}
                  onChangeText={v=>setEditMealData(prev=>({...prev,correction:v}))}
                />
                {editMealData.analyzing?(
                  <View style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:C.card,borderRadius:14,padding:16,marginTop:16}}>
                    <ActivityIndicator color={C.lime}/>
                    <Text style={{fontSize:13,color:C.muted}}>{t.recalculating}</Text>
                  </View>
                ):(
                  <>
                    <TouchableOpacity style={[s.confirmBtn,{marginTop:16}]} onPress={()=>{
                      if(editMealData.correction?.trim()){
                        saveEditMealAI();
                      } else {
                        const mt=MEAL_TYPES.find(t=>t.id===editMealData.mealType)||MEAL_TYPES[0];
                        const updated=[...meals];
                        updated[editMealIdx]={...updated[editMealIdx],mealType:editMealData.mealType,mealTypeLabel:mt.label,mealTypeIcon:mt.icon};
                        setMeals(updated); saveMeals(updated);
                        setShowEditMeal(false); setEditMealIdx(null); setEditMealData({});
                      }
                    }}>
                      <Text style={{fontSize:15,fontWeight:'700',color:'#0d0f14'}}>
                        {editMealData.correction?.trim()?t.recalculate:t.save}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cancelBtn} onPress={()=>setShowEditMeal(false)}>
                      <Text style={{fontSize:14,color:C.muted}}>{t.cancel}</Text>
                    </TouchableOpacity>
                  </>
                )}
                <View style={{height:32}}/>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MACRO DETAIL MODAL ──────────────────────────────── */}
      {showMacroModal && (()=>{
        const idx = showMacroModal==='protein'?0:showMacroModal==='carbs'?1:2;
        const vals = {protein:{value:totalP,goal:macroGoals.protein,color:C.lime},carbs:{value:totalC,goal:macroGoals.carbs,color:C.orange},fat:{value:totalG,goal:macroGoals.fat,color:C.blue}};
        const m = vals[showMacroModal];
        const pct = Math.min(100,m.goal>0?Math.round((m.value/m.goal)*100):0);
        const info = t.macroInfo[idx].replace('{goal}',m.goal);
        return (
          <Modal visible={true} animationType="fade" transparent onRequestClose={()=>setShowMacroModal(null)}>
            <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'center',alignItems:'center',padding:28}} activeOpacity={1} onPress={()=>setShowMacroModal(null)}>
              <TouchableWithoutFeedback onPress={e=>e.stopPropagation()}>
                <View style={{backgroundColor:C.surface,borderRadius:24,padding:24,width:'100%',borderWidth:1,borderColor:m.color}}>
                  <Text style={{fontSize:20,fontWeight:'800',color:m.color,marginBottom:4}}>{t.macroDetail[idx]}</Text>
                  <Text style={{fontSize:13,color:C.muted,lineHeight:20,marginBottom:20}}>{info}</Text>
                  <View style={{flexDirection:'row',gap:8,marginBottom:20}}>
                    {[{l:t.consumed,v:Math.round(m.value)+'g',c:m.color},{l:t.dailyGoal,v:m.goal+'g',c:C.text},{l:t.remaining2,v:Math.max(0,m.goal-Math.round(m.value))+'g',c:C.muted}].map((x,i)=>(
                      <View key={i} style={{flex:1,backgroundColor:C.card,borderRadius:14,paddingVertical:12,paddingHorizontal:6,alignItems:'center'}}>
                        <Text style={{fontSize:18,fontWeight:'800',color:x.c,marginBottom:4}}>{x.v}</Text>
                        <Text style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:0.3,textAlign:'center'}} numberOfLines={2}>{x.l}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{height:8,backgroundColor:C.card,borderRadius:99,overflow:'hidden',marginBottom:8}}>
                    <View style={{height:8,width:pct+'%',backgroundColor:m.color,borderRadius:99}}/>
                  </View>
                  <Text style={{fontSize:12,color:C.muted,textAlign:'right',marginBottom:20}}>{pct}%</Text>
                  <TouchableOpacity onPress={()=>setShowMacroModal(null)} style={{backgroundColor:C.card,borderRadius:14,height:46,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border}}>
                    <Text style={{fontSize:14,color:C.text,fontWeight:'600'}}>{t.close}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* ── PAYWALL MODAL ─────────────────────────────────── */}
      {showPaywall&&(
        <Modal visible={true} animationType="slide" transparent onRequestClose={()=>setShowPaywall(false)}>
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'flex-end'}}>
            <View style={{backgroundColor:C.surface,borderTopLeftRadius:32,borderTopRightRadius:32,padding:32,borderWidth:1,borderColor:C.border}}>
              <View style={{alignItems:'center',marginBottom:24}}>
                <Text style={{fontSize:40,marginBottom:12}}>🥗</Text>
                <Text style={{fontSize:24,fontWeight:'800',color:C.text,textAlign:'center',letterSpacing:-0.5,marginBottom:8}}>
                  {lang==='en'?'Unlock CaloriApp':'Desbloquea CaloriApp'}
                </Text>
                <Text style={{fontSize:14,color:C.muted,textAlign:'center',lineHeight:22}}>
                  {lang==='en'?'Analyze unlimited meals with AI. Track your macros and reach your goals.':'Analiza comidas ilimitadas con IA. Controla tus macros y alcanza tus objetivos.'}
                </Text>
              </View>
              {/* Features */}
              <View style={{gap:12,marginBottom:28}}>
                {(lang==='en'?['📸 Analyze photos with AI','✏️ Describe any meal','📊 Macros & calories tracking','🎯 Personalized calorie goals','📋 Full history & progress']:['📸 Analiza fotos con IA','✏️ Describe cualquier comida','📊 Control de macros y calorías','🎯 Objetivo calórico personalizado','📋 Historial completo y progreso']).map((f,i)=>(
                  <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10}}>
                    <View style={{width:28,height:28,borderRadius:14,backgroundColor:'rgba(198,241,53,0.15)',alignItems:'center',justifyContent:'center'}}>
                      <Text style={{fontSize:14}}>{f.split(' ')[0]}</Text>
                    </View>
                    <Text style={{fontSize:14,color:C.text,flex:1}}>{f.split(' ').slice(1).join(' ')}</Text>
                  </View>
                ))}
              </View>
              {/* Price */}
              <View style={{backgroundColor:C.card,borderRadius:16,padding:16,marginBottom:20,alignItems:'center',borderWidth:1,borderColor:C.lime}}>
                <Text style={{fontSize:13,color:C.muted,marginBottom:4}}>{lang==='en'?'Monthly subscription':'Suscripción mensual'}</Text>
                <Text style={{fontSize:36,fontWeight:'800',color:C.lime,fontStyle:'italic',letterSpacing:-1}}>2,99€<Text style={{fontSize:14,fontWeight:'400',color:C.muted,fontStyle:'normal'}}>/mes</Text></Text>
                <Text style={{fontSize:11,color:C.muted,marginTop:4}}>{lang==='en'?'Cancel anytime':'Cancela cuando quieras'}</Text>
              </View>
              {/* Subscribe button — in production this triggers RevenueCat */}
              <TouchableOpacity
                style={{backgroundColor:C.lime,borderRadius:16,height:54,alignItems:'center',justifyContent:'center',marginBottom:12}}
                onPress={()=>{
                  // TODO: Replace with RevenueCat purchase when compiled
                  setIsSubscribed(true);
                  AsyncStorage.setItem('csubscribed',JSON.stringify(true)).catch(()=>{});
                  setShowPaywall(false);
                }}>
                <Text style={{fontSize:16,fontWeight:'800',color:'#0d0f14'}}>{lang==='en'?'Subscribe for 2.99€/month':'Suscribirse por 2,99€/mes'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setShowPaywall(false)} style={{alignItems:'center',padding:12}}>
                <Text style={{fontSize:13,color:C.muted}}>{lang==='en'?'Maybe later':'Ahora no'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <OnboardingModal visible={showOnboarding} onDone={()=>{ setShowOnboarding(false); setTimeout(openSettings,400); }}/>
    </SafeAreaView>
      {/* ── CUSTOM ALERT — fuera de SafeAreaView para estar encima de Modals ── */}
      {customAlert && (
        <Modal visible={true} transparent animationType="fade">
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.78)',justifyContent:'center',alignItems:'center',padding:40}}>
            <View style={{backgroundColor:C.surface,borderRadius:20,padding:24,width:'100%',borderWidth:1,borderColor:C.border}}>
              <Text style={{fontSize:18,fontWeight:'700',color:C.text,textAlign:'center',marginBottom:8}}>{customAlert.title}</Text>
              <Text style={{fontSize:14,color:C.muted,textAlign:'center',lineHeight:22,marginBottom:24}}>{customAlert.message}</Text>
              <View style={{flexDirection:customAlert.buttons.length>1?'row':'column',gap:10}}>
                {customAlert.buttons.map((btn,i)=>(
                  <TouchableOpacity
                    key={i}
                    style={{flex:customAlert.buttons.length>1?1:undefined,backgroundColor:btn.style==='destructive'?'rgba(255,92,92,0.15)':btn.style==='confirm'?C.lime:C.card,borderWidth:1,borderColor:btn.style==='destructive'?C.danger:btn.style==='confirm'?C.lime:C.border,borderRadius:14,height:46,alignItems:'center',justifyContent:'center'}}
                    onPress={()=>{ setCustomAlert(null); btn.onPress&&btn.onPress(); }}
                  >
                    <Text style={{fontSize:15,fontWeight:'600',color:btn.style==='destructive'?C.danger:btn.style==='confirm'?'#0d0f14':C.text}}>{btn.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}




function OnboardingModal({visible,onDone}){
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.92)",justifyContent:"center",padding:24}}>
          <View style={{backgroundColor:"#161920",borderRadius:24,padding:28,borderWidth:1,borderColor:"#2a2f3a",alignItems:'center'}}>
            <Text style={{fontSize:48,marginBottom:16}}>🥗</Text>
            <Text style={{fontSize:24,fontWeight:"800",color:"#f0f2f5",textAlign:"center",marginBottom:8,letterSpacing:-0.5}}>Bienvenido a CaloriApp</Text>
            <Text style={{fontSize:14,color:"#7a8494",textAlign:"center",marginBottom:32,lineHeight:22}}>Analiza tus comidas con IA y alcanza tus objetivos</Text>
            {[['📸','Fotos de comida'],['✏️','Descripción de recetas'],['📊','Macros y calorías'],['🎯','Objetivos personalizados']].map(([icon,txt],i)=>(
              <View key={i} style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:12,alignSelf:'flex-start'}}>
                <Text style={{fontSize:20}}>{icon}</Text>
                <Text style={{fontSize:14,color:'#f0f2f5'}}>{txt}</Text>
              </View>
            ))}
            <TouchableOpacity style={{backgroundColor:"#c6f135",borderRadius:16,height:52,alignItems:"center",justifyContent:"center",width:'100%',marginTop:20}} onPress={onDone}>
              <Text style={{fontSize:16,fontWeight:"800",color:"#0d0f14"}}>Empezar →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:C.bg, paddingTop: Platform.OS==='android' ? StatusBar.currentHeight||24 : 0 },
  scroll: { flex:1 },
  scrollContent: { paddingTop:12 },
  logo: { fontSize:24, fontWeight:'800', color:C.text, letterSpacing:1, fontStyle:'italic', textShadowColor:'rgba(240,242,245,0.15)', textShadowOffset:{width:1,height:2}, textShadowRadius:4 },
  datePill: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, paddingHorizontal:14, paddingVertical:6, borderRadius:50 },
  iconBtn: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  modeBadge: { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:24, marginBottom:16, paddingVertical:10, paddingHorizontal:16, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:50, alignSelf:'flex-start' },
  modeDot: { width:8, height:8, borderRadius:4 },
  ringCard: { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:20, padding:24, marginHorizontal:24, marginBottom:16 },
  statsRow: { flexDirection:'row', gap:10, paddingHorizontal:24, marginBottom:20 },
  statCard: { flex:1, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:16, padding:14, alignItems:'center' },
  mealCard: { flexDirection:'row', backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:20, marginBottom:12, overflow:'hidden' },
  mealImg: { width:90, height:90 },
  mealImgPh: { width:90, height:90, backgroundColor:C.card, alignItems:'center', justifyContent:'center' },
  fab: { position:'absolute', bottom:32, left:24, right:24, backgroundColor:C.lime, borderRadius:18, height:58, flexDirection:'row', alignItems:'center', justifyContent:'center' },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet: { backgroundColor:C.surface, borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:40, borderWidth:1, borderColor:C.border },
  handle: { width:40, height:4, backgroundColor:C.border, borderRadius:99, alignSelf:'center', marginBottom:20 },
  sheetTitle: { fontSize:20, fontWeight:'700', color:C.text, marginBottom:6 },
  tabRow: { flexDirection:'row', gap:8, marginBottom:18 },
  tabBtn: { flex:1, backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:12, padding:10, alignItems:'center' },
  tabOn: { backgroundColor:C.lime, borderColor:C.lime },
  photoBtn: { backgroundColor:C.card, borderWidth:2, borderColor:C.border, borderStyle:'dashed', borderRadius:20, height:120, alignItems:'center', justifyContent:'center' },
  textarea: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:16, color:C.text, fontSize:14, padding:14, height:120 },
  confirmBtn: { backgroundColor:C.lime, borderRadius:14, height:50, alignItems:'center', justifyContent:'center' },
  cancelBtn: { borderWidth:1, borderColor:C.border, borderRadius:14, height:46, alignItems:'center', justifyContent:'center', marginTop:8 },
  secTitle: { fontSize:12, fontWeight:'700', color:C.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 },
  fieldRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:C.card, borderRadius:14, padding:14, marginBottom:8 },
  fieldLabel: { fontSize:14, color:C.text },
  input: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:10, color:C.text, fontSize:15, padding:10 },
  pill: { backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:10, paddingVertical:8, paddingHorizontal:14 },
  modeCard: { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderWidth:1.5, borderColor:C.border, borderRadius:18, padding:14, marginBottom:10 },
});
