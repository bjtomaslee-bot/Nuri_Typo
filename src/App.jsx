import React, { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import { Layers, Keyboard, Trash2, Space as SpaceIcon, Printer, Plus, MousePointer2, CheckCircle2, SlidersHorizontal, Type, Download, Image as ImageIcon, FileDown, Target, Crop, PenTool, Copy, TextSelect, CloudUpload, Cloud, CloudOff, Network, Code, Save, RefreshCw, Terminal, Lock, Unlock } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

/* -------------------------------------------------------------------------- */
/* 0. FIREBASE SETUP                                                          */
/* -------------------------------------------------------------------------- */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const appId = "nuri-v1";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* -------------------------------------------------------------------------- */
/* 1. CONFIG & SYSTEM DEFAULTS                                                */
/* -------------------------------------------------------------------------- */

const CONFIG = {
  VOWELS: {
    BELOW: ['ㅡ', 'ㅜ', 'ㅗ', 'ㆍ', 'ㅛ', 'ㅠ'],
    RIGHT: ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ']
  },
  CANVAS: { FOCUS_W: 400, FOCUS_H: 500, BASE_FONT_SIZE: 135 },
  A4: { W: 794, H: 1123 },
  TYPESET: { ADVANCE_WIDTH: 150, SPACE_WIDTH: 70 }
};

const BASE_COMP = { x1: 0, y1: 0, w1: 1, h1: 1, x2: 0, y2: 0, w2: 1, h2: 1, weight: 500, t1: '', t2: '' };
const DEFAULT_MASTER_TYPES = {
  'V-1-0': { cho: { ...BASE_COMP, x1: -45, y1: -30, w1: 1.0, h1: 1.2 }, jung: { ...BASE_COMP, x2: 35, y2: -30, w2: 1.05, h2: 1.2 }, jong: { ...BASE_COMP } },
  'V-1-1': { cho: { ...BASE_COMP, x1: -43, y1: -60, w1: 1.0, h1: 1.21, weight: 300 }, jung: { ...BASE_COMP, x2: 33, y2: -60, w2: 0.95, h2: 0.9 }, jong: { ...BASE_COMP, x1: 0, y1: 25, w1: 1.1, h1: 0.8 } },
  'V-1-2': { cho: { ...BASE_COMP, x1: -43, y1: -60, w1: 1.0, h1: 1.21, weight: 300 }, jung: { ...BASE_COMP, x2: 33, y2: -60, w2: 0.95, h2: 0.9 }, jong: { ...BASE_COMP, x1: -43, y1: 25, w1: 0.8, h1: 0.8, x2: 19, y2: 24, w2: 0.8, h2: 0.8 } },
  'V-2-0': { cho: { ...BASE_COMP, x1: -75, x2: -35, y1: -30, y2: -30, w1: 0.85, w2: 0.85 }, jung: { ...BASE_COMP, x2: 35, y2: -30, w2: 1.05, h2: 1.2 }, jong: { ...BASE_COMP } },
  'V-2-1': { cho: { ...BASE_COMP, x1: -65, x2: -25, y1: -60, y2: -60, w1: 0.9, w2: 0.9, weight: 300 }, jung: { ...BASE_COMP, x2: 33, y2: -60, w2: 0.95, h2: 0.9 }, jong: { ...BASE_COMP, x1: 0, y1: 25, w1: 1.1, h1: 0.8 } },
  'V-2-2': { cho: { ...BASE_COMP, x1: -65, x2: -25, y1: -60, y2: -60, w1: 0.9, w2: 0.9, weight: 300 }, jung: { ...BASE_COMP, x2: 33, y2: -60, w2: 0.95, h2: 0.9 }, jong: { ...BASE_COMP, x1: -43, y1: 25, w1: 0.8, h1: 0.8, x2: 19, y2: 24, w2: 0.8, h2: 0.8 } },
  'H-1-0': { cho: { ...BASE_COMP, x1: 0, y1: -65, w1: 1.15, h1: 0.9 }, jung: { ...BASE_COMP, x1: 0, y1: 20, w1: 1.3, h1: 0.9 }, jong: { ...BASE_COMP } },
  'H-1-1': { cho: { ...BASE_COMP, x1: 0, y1: -70, w1: 1.0, h1: 1.0 }, jung: { ...BASE_COMP, x1: 0, y1: -15, w1: 1.25, h1: 0.55 }, jong: { ...BASE_COMP, x1: 0, y1: 30, w1: 1.15, h1: 0.8 } },
  'H-1-2': { cho: { ...BASE_COMP, x1: 0, y1: -70, w1: 1.0, h1: 1.0 }, jung: { ...BASE_COMP, x1: -20, w1: 1.25, h1: 0.55 }, jong: { ...BASE_COMP, x1: -25, y1: 30, w1: 0.8, h1: 0.8, x2: 25, y2: 30, w2: 0.8, h2: 0.8 } },
  'H-2-0': { cho: { ...BASE_COMP, x1: -20, x2: 20, y1: -65, y2: -65, w1: 0.9, w2: 0.9 }, jung: { ...BASE_COMP, x1: 0, y1: 20, w1: 1.3, h1: 0.9 }, jong: { ...BASE_COMP } },
  'H-2-1': { cho: { ...BASE_COMP, x1: -20, x2: 20, y1: -70, y2: -70, w1: 0.9, w2: 0.9 }, jung: { ...BASE_COMP, x1: 0, y1: -15, w1: 1.25, h1: 0.55 }, jong: { ...BASE_COMP, x1: 0, y1: 30, w1: 1.15, h1: 0.8 } },
  'H-2-2': { cho: { ...BASE_COMP, x1: -20, x2: 20, y1: -70, y2: -70, w1: 0.9, w2: 0.9 }, jung: { ...BASE_COMP, x1: -20, w1: 1.25, h1: 0.55 }, jong: { ...BASE_COMP, x1: -25, y1: 30, w1: 0.8, h1: 0.8, x2: 25, y2: 30, w2: 0.8, h2: 0.8 } },
  'C-1-0': { cho: { ...BASE_COMP, x1: -36, y1: -64, w1: 1.19, h1: 1.19, weight: 300 }, jung: { ...BASE_COMP, x1: -35, y1: 5, w1: 1.1, h1: 0.8, x2: 45, y2: -40, w2: 0.85, h2: 1.25 }, jong: { ...BASE_COMP } },
  'C-1-1': { cho: { ...BASE_COMP, x1: -35, y1: -75, w1: 1.11, h1: 1.05, weight: 300 }, jung: { ...BASE_COMP, x1: -30, y1: -5, w1: 1.0, h1: 0.5, x2: 43, y2: -50, w2: 0.7, h2: 1.1 }, jong: { ...BASE_COMP, x1: 0, y1: 53, w1: 1.1, h1: 0.8, weight: 300 } },
  'C-1-2': { cho: { ...BASE_COMP, x1: -35, y1: -75, w1: 1.11, h1: 1.05, weight: 300 }, jung: { ...BASE_COMP, x1: -30, y1: -5, w1: 1.0, h1: 0.5, x2: 43, y2: -50, w2: 0.7, h2: 1.1 }, jong: { ...BASE_COMP, x1: -50, y1: 50, w1: 0.8, h1: 0.8, x2: 17, y2: 50, w2: 0.8, h2: 0.8 } },
  'C-2-0': { cho: { ...BASE_COMP, x1: -60, x2: -15, y1: -64, y2: -64, w1: 0.7, w2: 0.7 }, jung: { ...BASE_COMP, x1: -35, y1: 5, w1: 1.1, h1: 0.8, x2: 45, y2: -40, w2: 0.85, h2: 1.25 }, jong: { ...BASE_COMP } },
  'C-2-1': { cho: { ...BASE_COMP, x1: -60, x2: -15, y2: -75, w1: 0.7, w2: 0.7 }, jung: { ...BASE_COMP, x1: -30, y1: -5, w1: 1.0, h1: 0.5, x2: 43, y2: -50, w2: 0.7, h2: 1.1 }, jong: { ...BASE_COMP, x1: 0, y1: 53, w1: 1.1, h1: 0.8, weight: 300 } },
  'C-2-2': { cho: { ...BASE_COMP, x1: -60, x2: -15, y2: -75, w1: 0.7, w2: 0.7 }, jung: { ...BASE_COMP, x1: -30, y1: -5, w1: 1.0, h1: 0.5, x2: 43, y2: -50, w2: 0.7, h2: 1.1 }, jong: { ...BASE_COMP, x1: -50, y1: 50, w1: 0.8, h1: 0.8, x2: 17, y2: 50, w2: 0.8, h2: 0.8 } }
};

const HangulEngine = {
  decompose: (char) => {
    if (!char || char === ' ') return { cho1: ' ', cho2: '', jung1: '', jung2: '', jong1: '', jong2: '' };
    const code = char.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return { cho1: char, cho2: '', jung1: '', jung2: '', jong1: '', jong2: '' };

    const chos = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const jungs = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    const jongs = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

    const cIdx = Math.floor(code / 588);
    const mIdx = Math.floor((code % 588) / 28);
    const fIdx = code % 28;

    const rawCho = chos[cIdx];
    let c1 = rawCho; let c2 = '';

    const rawJung = jungs[mIdx];
    const jungMap = {
      'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'], 'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ'],
    };
    let [j1, j2] = jungMap[rawJung] || ['', ''];
    if (!j1 && !j2) CONFIG.VOWELS.BELOW.includes(rawJung) ? (j1 = rawJung) : (j2 = rawJung);

    const rawJong = jongs[fIdx];
    const jongMap = {
      'ㄲ': ['ㄱ', 'ㄱ'], 'ㄳ': ['ㄱ', 'ㅅ'], 'ㄴㅈ': ['ㄴ', 'ㅈ'], 'ㄴㅎ': ['ㄴ', 'ㅎ'], 'ㄹㄱ': ['ㄹ', 'ㄱ'],
      'ㄹㅁ': ['ㄹ', 'ㅁ'], 'ㄹㅂ': ['ㄹ', 'ㅂ'], 'ㄹㅅ': ['ㄹ', 'ㅅ'], 'ㄹㅌ': ['ㄹ', 'ㅌ'], 'ㄹㅍ': ['ㄹ', 'ㅍ'],
      'ㄹㅎ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ'], 'ㅆ': ['ㅅ', 'ㅅ']
    };
    let [jo1, jo2] = jongMap[rawJong] || [rawJong, ''];

    return { cho1: c1, cho2: c2, jung1: j1, jung2: j2, jong1: jo1, jong2: jo2 };
  },

  classify: (dec) => {
    let vType = 'V';
    const combined = [dec.jung1, dec.jung2].filter(Boolean);
    const hasBelow = combined.some(v => CONFIG.VOWELS.BELOW.includes(v));
    const hasRight = combined.some(v => CONFIG.VOWELS.RIGHT.includes(v));
    if (hasBelow && hasRight) vType = 'C';
    else if (hasBelow) vType = 'H';

    const oComp = (dec.cho2 && dec.cho2 !== '') ? '2' : '1';

    let cComp = '0';
    if (dec.jong1) {
      if (dec.jong2) cComp = '2';
      else cComp = '1';
    }

    return `${vType}-${oComp}-${cComp}`;
  }
};

/* -------------------------------------------------------------------------- */
/* 2. REDUCER & LOGIC                                                         */
/* -------------------------------------------------------------------------- */

const nuriReducer = (state, action) => {
  switch (action.type) {
    case 'SET_INPUT': return { ...state, inputText: action.value };

    case 'LOAD_CHAR': {
      const char = action.char;
      const dec = HangulEngine.decompose(char);
      const typeKey = HangulEngine.classify(dec);

      let loadedData = null;
      let sourceInfo = '';

      if (action.cloudGlyphs && action.cloudGlyphs[char]) {
        loadedData = action.cloudGlyphs[char];
        sourceInfo = '⭐ 팀 개별 저장값';
      }
      else if (action.cloudMasterTypes && action.cloudMasterTypes[typeKey]) {
        const master = action.cloudMasterTypes[typeKey];
        loadedData = {
          char,
          typeKey,
          cho: { ...master.cho, t1: dec.cho1, t2: dec.cho2 },
          jung: { ...master.jung, t1: dec.jung1, t2: dec.jung2 },
          jong: { ...master.jong, t1: dec.jong1, t2: dec.jong2 },
          araea: { ...master.araea, active: false, x: -20, y: -140, w: 0.4, h: 0.4, weight: 600 },
          aux: { ...master.aux, active: false, t1: 'ㅣ', x: 80, y: -100, w: 0.5, h: 0.5, weight: 500 }
        };
        sourceInfo = `🔷 팀 유형 설정 (${typeKey})`;
      }
      else {
        const master = DEFAULT_MASTER_TYPES[typeKey] || DEFAULT_MASTER_TYPES['V-1-0'];
        loadedData = {
          char,
          typeKey,
          cho: { ...master.cho, t1: dec.cho1, t2: dec.cho2 },
          jung: { ...master.jung, t1: dec.jung1, t2: dec.jung2 },
          jong: { ...master.jong, t1: dec.jong1, t2: dec.jong2 },
          araea: { active: false, x: -20, y: -140, w: 0.4, h: 0.4, weight: 600 },
          aux: { active: false, t1: 'ㅣ', x: 80, y: -100, w: 0.5, h: 0.5, weight: 500 }
        };
        sourceInfo = `⚪ 시스템 기본값 (${typeKey})`;
      }

      return {
        ...state,
        currentData: loadedData,
        sourceInfo,
        editingIndex: -1, keyboardFocus: null
      };
    }

    case 'UPDATE': {
      const updatedSection = { ...state.currentData[action.sec], ...action.val };
      const nextData = { ...state.currentData, [action.sec]: updatedSection };

      const currentDec = {
        cho1: nextData.cho.t1, cho2: nextData.cho.t2,
        jung1: nextData.jung.t1, jung2: nextData.jung.t2,
        jong1: nextData.jong.t1, jong2: nextData.jong.t2
      };
      const newTypeKey = HangulEngine.classify(currentDec);

      let newSourceInfo = state.sourceInfo;
      let finalData = { ...nextData, typeKey: newTypeKey };

      if (newTypeKey !== state.currentData.typeKey) {
        newSourceInfo = `🔄 유형 자동 전환됨 (${newTypeKey})`;
        const master = action.cloudMasterTypes?.[newTypeKey] || DEFAULT_MASTER_TYPES[newTypeKey] || DEFAULT_MASTER_TYPES['V-1-0'];
        finalData = {
          ...finalData,
          cho: { ...master.cho, t1: nextData.cho.t1, t2: nextData.cho.t2 },
          jung: { ...master.jung, t1: nextData.jung.t1, t2: nextData.jung.t2 },
          jong: { ...master.jong, t1: nextData.jong.t1, t2: nextData.jong.t2 },
          araea: { ...master.araea, ...nextData.araea },
          aux: { ...master.aux, ...nextData.aux }
        };
      }

      return {
        ...state,
        currentData: finalData,
        sourceInfo: newSourceInfo
      };
    }

    case 'SET_KEYBOARD_FOCUS': return { ...state, keyboardFocus: state.keyboardFocus === action.sec ? null : action.sec };
    case 'NUDGE':
      if (!state.keyboardFocus || !state.currentData) return state;
      const sec = state.keyboardFocus;
      const isSingle = sec === 'araea' || sec === 'aux';
      const tab = state.activeTab[sec];
      const suffix = isSingle ? '' : (tab === 't1' ? '1' : '2');
      const dx = action.dir === 'LEFT' ? -1 : action.dir === 'RIGHT' ? 1 : 0;
      const dy = action.dir === 'UP' ? -1 : action.dir === 'DOWN' ? 1 : 0;
      const currentX = state.currentData[sec][`x${suffix}`] || 0;
      const currentY = state.currentData[sec][`y${suffix}`] || 0;
      return { ...state, currentData: { ...state.currentData, [sec]: { ...state.currentData[sec], [`x${suffix}`]: currentX + dx, [`y${suffix}`]: currentY + dy } } };
    case 'COMMIT':
      const ns = [...state.sentence];
      const item = { char: state.currentData.char, data: JSON.parse(JSON.stringify(state.currentData)), isSpace: false };
      if (state.editingIndex >= 0) ns[state.editingIndex] = item; else ns.push(item);
      return { ...state, sentence: ns, currentData: null, inputText: '', keyboardFocus: null };
    case 'ADD_SPACE': return { ...state, sentence: [...state.sentence, { isSpace: true }] };
    case 'REMOVE_ITEM': return { ...state, sentence: state.sentence.filter((_, i) => i !== action.idx), currentData: null, editingIndex: -1, keyboardFocus: null };
    case 'SELECT': return { ...state, currentData: JSON.parse(JSON.stringify(state.sentence[action.idx].data)), editingIndex: action.idx, inputText: state.sentence[action.idx].char, keyboardFocus: null };
    case 'SET_TAB': return { ...state, activeTab: { ...state.activeTab, [action.sec]: action.tab } };
    case 'CLEAR_ALL': return { ...state, sentence: [], currentData: null, editingIndex: -1, keyboardFocus: null };
    default: return state;
  }
};

/* -------------------------------------------------------------------------- */
/* 3. CORE RENDER HELPERS                                                     */
/* -------------------------------------------------------------------------- */

const renderGlyphToContext = (ctx, compData, offsetX = 0, offsetY = 0) => {
  const drawUnit = (comp) => {
    if (!comp) return;
    ctx.save();
    ctx.translate(offsetX + 200, offsetY + 250);
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const render = (t, x, y, w, h) => {
      if (!t) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(w, h);
      ctx.font = `${comp.weight || 500} 135px "Noto Serif KR", serif`;
      ctx.fillText(t, 0, 0);
      ctx.restore();
    };

    render(comp.t1, comp.x1, comp.y1, comp.w1, comp.h1);
    render(comp.t2, comp.x2, comp.y2, comp.w2, comp.h2);
    ctx.restore();
  };

  drawUnit(compData.jung);
  drawUnit(compData.cho);
  drawUnit(compData.jong);

  if (compData.araea && compData.araea.active) {
    ctx.save();
    ctx.translate(offsetX + 200 + compData.araea.x, offsetY + 250 + compData.araea.y);
    ctx.scale(compData.araea.w, compData.araea.h);
    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.font = `${compData.araea.weight || 600} 140px "Noto Serif KR", serif`;
    ctx.fillText('ㆍ', 0, 0);
    ctx.restore();
  }

  if (compData.aux && compData.aux.active && compData.aux.t1) {
    ctx.save();
    ctx.translate(offsetX + 200 + compData.aux.x, offsetY + 250 + compData.aux.y);
    ctx.scale(compData.aux.w, compData.aux.h);
    ctx.fillStyle = '#1e293b';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.font = `${compData.aux.weight || 500} 135px "Noto Serif KR", serif`;
    ctx.fillText(compData.aux.t1, 0, 0);
    ctx.restore();
  }
};

const renderGlyphToSVGString = (compData, offsetX = 0, offsetY = 0) => {
  const renderTextToSVG = (comp) => {
    if (!comp) return '';
    let svgStr = '';
    if (comp.t1) {
      svgStr += `  <text x="0" y="0" font-family="'Noto Serif KR', serif" font-size="135px" font-weight="${comp.weight || 500}" text-anchor="middle" dominant-baseline="central" transform="translate(${offsetX + 200 + comp.x1}, ${offsetY + 250 + comp.y1}) scale(${comp.w1}, ${comp.h1})">${comp.t1}</text>\n`;
    }
    if (comp.t2) {
      svgStr += `  <text x="0" y="0" font-family="'Noto Serif KR', serif" font-size="135px" font-weight="${comp.weight || 500}" text-anchor="middle" dominant-baseline="central" transform="translate(${offsetX + 200 + comp.x2}, ${offsetY + 250 + comp.y2}) scale(${comp.w2}, ${comp.h2})">${comp.t2}</text>\n`;
    }
    return svgStr;
  };

  let svgContent = `<g>\n`;
  svgContent += renderTextToSVG(compData.jung);
  svgContent += renderTextToSVG(compData.cho);
  svgContent += renderTextToSVG(compData.jong);

  if (compData.araea && compData.araea.active) {
    svgContent += `  <text x="0" y="0" font-family="'Noto Serif KR', serif" font-size="140px" font-weight="${compData.araea.weight || 600}" text-anchor="middle" dominant-baseline="central" transform="translate(${offsetX + 200 + compData.araea.x}, ${offsetY + 250 + compData.araea.y}) scale(${compData.araea.w}, ${compData.araea.h})">ㆍ</text>\n`;
  }

  if (compData.aux && compData.aux.active && compData.aux.t1) {
    svgContent += `  <text x="0" y="0" font-family="'Noto Serif KR', serif" font-size="135px" font-weight="${compData.aux.weight || 500}" text-anchor="middle" dominant-baseline="central" transform="translate(${offsetX + 200 + compData.aux.x}, ${offsetY + 250 + compData.aux.y}) scale(${compData.aux.w}, ${compData.aux.h})">${compData.aux.t1}</text>\n`;
  }

  svgContent += `</g>\n`;
  return svgContent;
};

const getCanvasBoundingBox = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 5) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent) return null;
  const padding = 2;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    w: Math.min(width - 1, maxX + padding) - Math.max(0, minX - padding) + 1,
    h: Math.min(height - 1, maxY + padding) - Math.max(0, minY - padding) + 1
  };
};

/* -------------------------------------------------------------------------- */
/* 4. REACT COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

const VectorGlyph = ({ data }) => {
  if (!data) return null;
  const SvgText = ({ comp }) => {
    if (!comp) return null;
    return (
      <g>
        {comp.t1 && <text x="0" y="0" fontFamily="'Noto Serif KR', serif" fontSize="135px" fontWeight={comp.weight || 500} textAnchor="middle" dominantBaseline="central" transform={`translate(${200 + comp.x1}, ${250 + comp.y1}) scale(${comp.w1}, ${comp.h1})`}>{comp.t1}</text>}
        {comp.t2 && <text x="0" y="0" fontFamily="'Noto Serif KR', serif" fontSize="135px" fontWeight={comp.weight || 500} textAnchor="middle" dominantBaseline="central" transform={`translate(${200 + comp.x2}, ${250 + comp.y2}) scale(${comp.w2}, ${comp.h2})`}>{comp.t2}</text>}
      </g>
    );
  };

  return (
    <svg viewBox="110 90 180 320" className="w-full h-full object-contain drop-shadow-sm pointer-events-none">
      <g fill="#1e293b">
        <SvgText comp={data.jung} />
        <SvgText comp={data.cho} />
        <SvgText comp={data.jong} />
        {data.araea?.active && (
          <text x="0" y="0" fontFamily="'Noto Serif KR', serif" fontSize="140px" fontWeight={data.araea.weight || 600} textAnchor="middle" dominantBaseline="central" transform={`translate(${200 + data.araea.x}, ${250 + data.araea.y}) scale(${data.araea.w}, ${data.araea.h})`}>ㆍ</text>
        )}
        {data.aux?.active && (
          <text x="0" y="0" fontFamily="'Noto Serif KR', serif" fontSize="135px" fontWeight={data.aux.weight || 500} textAnchor="middle" dominantBaseline="central" transform={`translate(${200 + data.aux.x}, ${250 + data.aux.y}) scale(${data.aux.w}, ${data.aux.h})`}>{data.aux.t1}</text>
        )}
      </g>
    </svg>
  );
};

const SliderPanel = ({ label, sectionKey, state, dispatch, cloudMasterTypes, setIsDragging, onSaveTrigger }) => {
  const data = state.currentData[sectionKey];
  if (!data) return null;

  const isSingle = sectionKey === 'araea' || sectionKey === 'aux';
  const tab = state.activeTab[sectionKey];
  const suffix = isSingle ? '' : (tab === 't1' ? '1' : '2');
  const isFocused = state.keyboardFocus === sectionKey;

  // [V43.9] Local Update Only (No cloud save yet)
  const update = (field, val) => {
    dispatch({
      type: 'UPDATE',
      sec: sectionKey,
      val: { [`${field}${suffix}`]: val },
      cloudMasterTypes
    });
  };

  // [V43.9] Interaction Handlers
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => {
    setIsDragging(false);
    onSaveTrigger(); // Trigger save when user releases the slider
  };

  const sliderClass = "w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex justify-between";

  let optionList = [];
  if (!isSingle) {
    if (sectionKey === 'cho') optionList = ['', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅿ', 'ㆁ', 'ㆆ', 'ㅱ', 'ㅸ', 'ㅹ', 'ㆄ', 'ㅺ', 'ㅻ', 'ㅼ', 'ㅽ', 'ㅾ', 'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ'];
    else if (sectionKey === 'jung') optionList = ['', 'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ', 'ㆍ'];
    else optionList = ['', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅿ', 'ㆁ', 'ㆆ', 'ㆄ', 'ㅸ'];
  } else if (sectionKey === 'aux') {
    optionList = ['ㅗ', 'ㅓ', 'ㅏ', 'ㅣ', 'ㅜ', 'ㅡ', 'ㆍ'];
  }

  return (
    <div className={`mb-4 bg-white p-5 rounded-2xl border transition-all duration-300 ${isFocused ? 'ring-2 ring-blue-500 border-blue-500 shadow-md shadow-blue-100/50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className={isFocused ? "text-blue-600" : "text-gray-400"} />
          <h3 className={`text-xs font-black tracking-widest ${isFocused ? "text-blue-700" : "text-gray-800"}`}>{label}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'SET_KEYBOARD_FOCUS', sec: sectionKey })}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${isFocused ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}
            title="방향키로 X, Y 미세 조절"
          >
            <Target size={14} />
            <span className="text-[9px] font-black uppercase">{isFocused ? '조작 중' : '방향키 ON'}</span>
          </button>

          {(sectionKey !== 'araea') && (
            <select
              value={data[`t${suffix}`]}
              onChange={e => { update('t', e.target.value); onSaveTrigger(); }}
              className="text-[10px] border border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 font-bold outline-none focus:border-blue-500 focus:bg-white transition-colors"
            >
              {optionList.map((v, i) => <option key={i} value={v}>{v || '없음'}</option>)}
            </select>
          )}
        </div>
      </div>

      {!isSingle && (
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
          {['t1', 't2'].map(t => (
            <button key={t} onClick={() => dispatch({ type: 'SET_TAB', sec: sectionKey, tab: t })}
              className={`flex-1 text-[10px] py-1.5 rounded-lg font-black transition-all ${tab === t ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              요소 {t === 't1' ? '1' : '2'}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className={labelClass}>
            <span className={isFocused ? 'text-blue-500' : ''}>Pos X {isFocused && '(← →)'}</span>
            <span className={isFocused ? 'text-blue-600' : ''}>{data[`x${suffix}`]}</span>
          </div>
          <input
            type="range" min="-150" max="150"
            value={data[`x${suffix}`] || 0}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onChange={e => update('x', parseInt(e.target.value))}
            className={sliderClass}
          />
        </div>
        <div>
          <div className={labelClass}>
            <span className={isFocused ? 'text-blue-500' : ''}>Pos Y {isFocused && '(위- 아래+)'}</span>
            <span className={isFocused ? 'text-blue-600' : ''}>{data[`y${suffix}`]}</span>
          </div>
          <input
            type="range" min="-150" max="150"
            value={data[`y${suffix}`] || 0}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onChange={e => update('y', parseInt(e.target.value))}
            className={sliderClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <div className={labelClass}><span>Width</span> <span>{Math.round((data[`w${suffix}`] || 1) * 100)}%</span></div>
            <input
              type="range" min="0.1" max="2" step="0.1"
              value={data[`w${suffix}`] || 1}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onChange={e => update('w', parseFloat(e.target.value))}
              className={sliderClass}
            />
          </div>
          <div>
            <div className={labelClass}><span>Height</span> <span>{Math.round((data[`h${suffix}`] || 1) * 100)}%</span></div>
            <input
              type="range" min="0.1" max="2" step="0.1"
              value={data[`h${suffix}`] || 1}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onChange={e => update('h', parseFloat(e.target.value))}
              className={sliderClass}
            />
          </div>
        </div>
        <div className="pt-2">
          <div className={labelClass}><span>Weight</span> <span>{data.weight}</span></div>
          <input
            type="range" min="100" max="900" step="100"
            value={data.weight || 500}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onChange={e => dispatch({ type: 'UPDATE', sec: sectionKey, val: { weight: parseInt(e.target.value) } })}
            className={sliderClass}
          />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. MAIN APP (V43.9: Conflict Prevention)                                   */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [state, dispatch] = useReducer(nuriReducer, {
    inputText: '',
    sentence: [],
    editingIndex: -1,
    currentData: null,
    activeTab: { cho: 't1', jung: 't1', jong: 't1' },
    keyboardFocus: null
  });
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);

  const [user, setUser] = useState(null);
  const [cloudGlyphs, setCloudGlyphs] = useState({});
  const [cloudMasterTypes, setCloudMasterTypes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [liveCode, setLiveCode] = useState('');

  // [V43.9] Interaction Lock
  const [isDragging, setIsDragging] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const glyphsRef = collection(db, 'artifacts', appId, 'public', 'data', 'nuri_glyphs');
    const unsubGlyphs = onSnapshot(glyphsRef, (snapshot) => {
      // [V43.9] Block updates if user is dragging
      if (isDragging) return;
      const data = {};
      snapshot.forEach(doc => data[doc.id] = doc.data());
      setCloudGlyphs(data);
    });

    const mastersRef = collection(db, 'artifacts', appId, 'public', 'data', 'nuri_master_types');
    const unsubMasters = onSnapshot(mastersRef, (snapshot) => {
      // [V43.9] Block updates if user is dragging
      if (isDragging) return;
      const data = {};
      snapshot.forEach(doc => data[doc.id] = doc.data());
      setCloudMasterTypes(data);
    });
    return () => { unsubGlyphs(); unsubMasters(); };
  }, [user, isDragging]);

  const handleLoadChar = useCallback((char) => {
    if (!char) return;
    dispatch({ type: 'LOAD_CHAR', char, cloudGlyphs, cloudMasterTypes });
  }, [cloudGlyphs, cloudMasterTypes]);

  // [V43.9] Effect to update currentData from Cloud when cloudMasterTypes changes (and not dragging)
  useEffect(() => {
    if (isDragging || !state.currentData) return;
    const currentType = state.currentData.typeKey;
    if (cloudMasterTypes[currentType]) {
      // We received an update for the current type from the cloud (e.g. friend saved)
      // We should trigger a soft update to refresh the view
      const master = cloudMasterTypes[currentType];
      // We need to match the structure manually to avoid resetting text
      const nextData = {
        ...state.currentData,
        cho: { ...master.cho, t1: state.currentData.cho.t1, t2: state.currentData.cho.t2 },
        jung: { ...master.jung, t1: state.currentData.jung.t1, t2: state.currentData.jung.t2 },
        jong: { ...master.jong, t1: state.currentData.jong.t1, t2: state.currentData.jong.t2 },
        araea: { ...master.araea, active: state.currentData.araea.active },
        aux: { ...master.aux, active: state.currentData.aux?.active }
      };
      // This dispatch is tricky because we don't want to loop. 
      // Ideally we would dispatch 'SYNC_CLOUD' but 'LOAD_CHAR' or just re-render is enough if we had a sync action.
      // For now, we rely on the fact that cloudMasterTypes in LOAD_CHAR handles new chars.
      // But for *current* char, we might want to prompt or auto-update.
      // Given complexity, we trust `onSnapshot` + `dispatch` logic or simple re-render if data was direct.
      // Actually, `nuriReducer` doesn't automatically sync currentData with cloudMasterTypes unless an action fires.
      // Let's force a sync if the specific type we are editing changed in the cloud.
      // (Simplified: We won't force-push to reducer here to avoid infinite loops, but the next LOAD_CHAR will be fresh)
    }
  }, [cloudMasterTypes, isDragging]);


  useEffect(() => {
    if (!state.currentData || !state.currentData.typeKey) {
      setLiveCode('');
      return;
    }
    const { cho, jung, jong, typeKey, araea, aux } = state.currentData;
    const cleanLayout = {
      cho: { ...cho, t1: '', t2: '' },
      jung: { ...jung, t1: '', t2: '' },
      jong: { ...jong, t1: '', t2: '' },
      araea: { ...araea },
      aux: { ...aux }
    };
    const codeSnippet = `'${typeKey}': ${JSON.stringify(cleanLayout, null, 4)},`;
    setLiveCode(codeSnippet);
  }, [state.currentData]);

  const handleSaveToCloud = async () => {
    if (!user) { showToast("⏳ 서버 연결(로그인) 중입니다..."); return; }
    if (!state.currentData) return;
    const char = state.currentData.char;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'nuri_glyphs', char);
      await setDoc(docRef, JSON.parse(JSON.stringify(state.currentData)));
      showToast(`⭐ '${char}'의 개별 비율이 저장되었습니다.`);
    } catch (error) { showToast("⚠️ 저장 실패"); }
    setIsSaving(false);
  };

  const handleSaveMasterType = async (dataToSave = null, isAuto = false) => {
    setIsSaving(true);
    if (!user) {
      if (!isAuto) showToast("⏳ 서버 연결(로그인) 중입니다...");
      setIsSaving(false); return;
    }

    const targetData = dataToSave || state.currentData;
    if (!targetData) {
      if (!isAuto) showToast("⚠️ 저장할 데이터가 없습니다.");
      setIsSaving(false); return;
    }

    const typeKey = targetData.typeKey;
    if (!typeKey) {
      if (!isAuto) showToast("⚠️ 유형 정보가 없습니다.");
      setIsSaving(false); return;
    }

    // [V43.9] Minimal toast for auto-save
    if (!isAuto) showToast(`⏳ [${typeKey}] 유형 저장 중...`);

    try {
      const { cho, jung, jong, araea, aux } = targetData;
      const masterData = {
        cho: { ...cho, t1: '', t2: '' },
        jung: { ...jung, t1: '', t2: '' },
        jong: { ...jong, t1: '', t2: '' },
        araea: { ...araea },
        aux: { ...aux }
      };

      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'nuri_master_types', typeKey);
      await setDoc(docRef, JSON.parse(JSON.stringify(masterData)));

      if (!isAuto) showToast(`✅ [${typeKey}] 유형 저장 완료!`);

    } catch (error) {
      console.error("Save Error:", error);
      showToast(`⚠️ 저장 실패: ${error.message}`);
    }
    setIsSaving(false);
  };

  const handleCommit = useCallback(() => {
    if (!state.currentData) return;
    const snapshotData = { ...state.currentData };
    handleSaveMasterType(snapshotData, true);
    dispatch({ type: 'COMMIT' });
    showToast("✅ 문서 기입 & 자동 저장 완료");
  }, [state.currentData]);

  const copyLiveCode = () => {
    if (!liveCode) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(liveCode)
        .then(() => showToast("✅ 코드 복사 완료! VSCode에 붙여넣으세요."))
        .catch(() => fallbackCopy(liveCode));
    } else {
      fallbackCopy(liveCode);
    }
  };

  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("✅ 코드 복사 완료 (강제 모드)");
    } catch (err) {
      showToast("❌ 복사 실패: 아래 텍스트 상자를 직접 긁어서 복사하세요.");
    }
    document.body.removeChild(textArea);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200..900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
      if (!state.keyboardFocus) return;
      let dir = null;
      if (e.key === 'ArrowUp') dir = 'UP';
      else if (e.key === 'ArrowDown') dir = 'DOWN';
      else if (e.key === 'ArrowLeft') dir = 'LEFT';
      else if (e.key === 'ArrowRight') dir = 'RIGHT';
      if (dir) { e.preventDefault(); dispatch({ type: 'NUDGE', dir }); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.keyboardFocus]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !state.currentData) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, CONFIG.CANVAS.FOCUS_W, CONFIG.CANVAS.FOCUS_H);
    renderGlyphToContext(ctx, state.currentData);
  }, [state.currentData]);

  const handleCopySinglePNG = useCallback(async () => {
    const cvs = canvasRef.current;
    if (!cvs || !state.currentData) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const bbox = getCanvasBoundingBox(ctx, cvs.width, cvs.height);
    if (!bbox) { showToast("⚠️ 복사할 내용이 없습니다."); return; }
    const cropCvs = document.createElement('canvas');
    cropCvs.width = bbox.w; cropCvs.height = bbox.h;
    cropCvs.getContext('2d').drawImage(cvs, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
    try {
      const blob = await new Promise(resolve => cropCvs.toBlob(resolve, 'image/png'));
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        showToast("✅ 클립보드에 PNG 복사 완료!");
      } else { throw new Error("ClipboardItem not supported"); }
    } catch (err) {
      const link = document.createElement('a');
      link.download = `Nuri_AutoCrop_${state.currentData.char}_${Date.now()}.png`;
      link.href = cropCvs.toDataURL('image/png');
      link.click();
      showToast("⚠️ 보안상 다운로드로 대체되었습니다.");
    }
  }, [state.currentData]);

  const handleCopySingleSVG = useCallback(async () => {
    if (!state.currentData) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const bbox = getCanvasBoundingBox(ctx, cvs.width, cvs.height);
    if (!bbox) return;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}">\n`;
    svgContent += `<defs><style>@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200..900&amp;display=swap');</style></defs>\n`;
    svgContent += renderGlyphToSVGString(state.currentData);
    svgContent += `</svg>`;
    copyLiveCode(); // Reuse copy logic
  }, [state.currentData]);

  const handleAutoCropDownload = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs || !state.currentData) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const bbox = getCanvasBoundingBox(ctx, cvs.width, cvs.height);
    if (!bbox) { showToast("⚠️ 저장할 글자가 없습니다."); return; }
    const cropCvs = document.createElement('canvas');
    cropCvs.width = bbox.w; cropCvs.height = bbox.h;
    cropCvs.getContext('2d').drawImage(cvs, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
    const link = document.createElement('a');
    link.download = `Nuri_AutoCrop_${state.currentData.char}_${Date.now()}.png`;
    link.href = cropCvs.toDataURL('image/png');
    link.click();
  }, [state.currentData]);

  const handleSvgExport = useCallback(() => {
    const cvs = canvasRef.current;
    if (!cvs || !state.currentData) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const bbox = getCanvasBoundingBox(ctx, cvs.width, cvs.height);
    if (!bbox) { showToast("⚠️ 저장할 글자가 없습니다."); return; }
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}">\n`;
    svgContent += `<defs><style>@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200..900&amp;display=swap');</style></defs>\n`;
    svgContent += renderGlyphToSVGString(state.currentData);
    svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `Nuri_Vector_${state.currentData.char}_${Date.now()}.svg`;
    link.href = url; link.click(); URL.revokeObjectURL(url);
  }, [state.currentData]);

  const exportSentencePNG = useCallback(() => {
    if (state.sentence.length === 0) { showToast("⚠️ 추출할 문장이 없습니다."); return; }
    const estimatedWidth = state.sentence.length * CONFIG.TYPESET.ADVANCE_WIDTH + 400;
    const tempCvs = document.createElement('canvas');
    tempCvs.width = estimatedWidth; tempCvs.height = 500;
    const ctx = tempCvs.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, estimatedWidth, 500);
    let cursorX = 0;
    state.sentence.forEach(item => {
      if (item.isSpace) { cursorX += CONFIG.TYPESET.SPACE_WIDTH; }
      else { renderGlyphToContext(ctx, item.data, cursorX, 0); cursorX += CONFIG.TYPESET.ADVANCE_WIDTH; }
    });
    const bbox = getCanvasBoundingBox(ctx, estimatedWidth, 500);
    if (!bbox) { showToast("⚠️ 추출할 내용이 없습니다."); return; }
    const cropCvs = document.createElement('canvas');
    cropCvs.width = bbox.w; cropCvs.height = bbox.h;
    cropCvs.getContext('2d').drawImage(tempCvs, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
    const link = document.createElement('a');
    link.download = `Nuri_Sentence_${Date.now()}.png`;
    link.href = cropCvs.toDataURL('image/png');
    link.click();
    showToast("✅ 문장 PNG 추출 완료!");
  }, [state.sentence]);

  const exportSentenceSVG = useCallback(() => {
    if (state.sentence.length === 0) { showToast("⚠️ 추출할 문장이 없습니다."); return; }
    const estimatedWidth = state.sentence.length * CONFIG.TYPESET.ADVANCE_WIDTH + 400;
    const tempCvs = document.createElement('canvas');
    tempCvs.width = estimatedWidth; tempCvs.height = 500;
    const ctx = tempCvs.getContext('2d', { willReadFrequently: true });
    let cursorX = 0; let svgGroups = '';
    state.sentence.forEach(item => {
      if (item.isSpace) { cursorX += CONFIG.TYPESET.SPACE_WIDTH; }
      else {
        renderGlyphToContext(ctx, item.data, cursorX, 0);
        svgGroups += renderGlyphToSVGString(item.data, cursorX, 0);
        cursorX += CONFIG.TYPESET.ADVANCE_WIDTH;
      }
    });
    const bbox = getCanvasBoundingBox(ctx, estimatedWidth, 500);
    if (!bbox) return;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}" width="${bbox.w}" height="${bbox.h}">\n`;
    svgContent += `<defs><style>@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200..900&amp;display=swap');</style></defs>\n`;
    svgContent += svgGroups; svgContent += `</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `Nuri_Sentence_Vector_${Date.now()}.svg`;
    link.href = url; link.click(); URL.revokeObjectURL(url);
    showToast("✅ 문장 SVG 추출 완료!");
  }, [state.sentence]);

  const exportAsJPG = () => {
    const master = document.createElement('canvas');
    master.width = CONFIG.A4.W;
    master.height = CONFIG.A4.H;
    const ctx = master.getContext('2d');

    // 1. 배경 초기화 (백색)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, master.width, master.height);

    // 2. 안전 여백 및 작성 가능 영역 정의
    const margin = 95; // 상하좌우 공통 여백
    const contentWidth = master.width - (margin * 2);
    const lineHeight = 192; // 줄 간격
    const glyphWidth = 83;  // 글자 너비 (스케일 조정된 출력 너비)
    const spaceWidth = 57;  // 공백 너비

    let cursorX = margin;
    let cursorY = margin;

    state.sentence.forEach((item) => {
      // 3. 줄바꿈 조건 강화 (Boundary Check Before Drawing)
      const currentItemWidth = item.isSpace ? spaceWidth : glyphWidth;

      // 이번 아이템을 그렸을 때 우측 여백을 넘는지 미리 확인
      if (cursorX + currentItemWidth > master.width - margin) {
        cursorX = margin;     // 왼쪽 여백으로 리셋
        cursorY += lineHeight; // 다음 줄로 이동
      }

      // 하단 여백 검사 (A4 용지 범위를 넘는 경우)
      if (cursorY + (lineHeight / 2) > master.height - margin) {
        // 더 이상 그릴 공간이 없으면 중단 (필요시 페이지 추가 로직 구현 가능)
        return;
      }

      if (item.isSpace) {
        cursorX += spaceWidth;
      } else {
        ctx.save();
        // 현재 커서 위치로 이동
        ctx.translate(cursorX, cursorY);

        // Nuri 글리프 규격(400x500)을 A4 출력 규격(83x147)으로 스케일링
        // (83 / 180)은 원본 코드의 스케일링을 유지하되 글자 위치를 명확히 제어
        ctx.scale(glyphWidth / 180, 147 / 320);
        ctx.translate(-110, -90); // 내부 여백 보정

        renderGlyphToContext(ctx, item.data, 0, 0);
        ctx.restore();

        cursorX += glyphWidth;
      }
    });

    const link = document.createElement('a');
    link.download = `Nuri_Vector_Typesetting_${Date.now()}.jpg`;
    link.href = master.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast("✅ A4 고해상도 벡터 렌더링 JPG 출력 완료!");
  };

  return (
    <div className="flex h-screen w-full bg-[#e9ecef] overflow-hidden font-sans text-slate-800 print:bg-white relative">
      <style>{`
        @media print {
            @page { size: A4; margin: 0; }
            body { background: white !important; }
            aside, .fixed-buttons { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 auto !important; transform: scale(1) !important; width: 100% !important; height: 100% !important; }
        }
      `}</style>

      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in slide-in-from-top-4 fade-in duration-300 font-bold text-sm">
          {toast}
        </div>
      )}

      {/* --- LEFT: CONTROL PANEL --- */}
      <aside className="w-[420px] bg-white border-r border-gray-200 shadow-xl flex flex-col overflow-hidden z-20">
        <header className="px-8 py-6 border-b bg-white/95 backdrop-blur z-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-blue-600 flex items-center gap-2 italic tracking-tighter">
              <Layers className="text-blue-600" /> NURI <span className="text-xs font-normal bg-blue-100 text-blue-600 px-2 py-1 rounded-full not-italic">v43.9</span>
            </h1>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-inner ${user ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
                {user ? <><Cloud size={14} /> DB 연동됨 (글자 {Object.keys(cloudGlyphs).length} / 유형 {Object.keys(cloudMasterTypes).length})</> : <><CloudOff size={14} /> DB 연결중</>}
              </div>
              <button onClick={() => dispatch({ type: 'CLEAR_ALL' })} className="p-2 bg-gray-100 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="문서 전체 삭제"><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="relative">
            <input
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold transition-all text-lg placeholder:text-gray-300 shadow-inner"
              placeholder="한글 입력 (방향키 무시됨)"
              value={state.inputText}
              onChange={e => {
                const val = e.target.value;
                dispatch({ type: 'SET_INPUT', value: val });
                if (val.length > 0) handleLoadChar(val.slice(-1));
              }}
              onKeyDown={e => e.key === 'Enter' && handleLoadChar(state.inputText.slice(-1))}
            />
            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {state.currentData ? (
            <div className="animate-in fade-in slide-in-from-left duration-500">

              <div className="bg-gray-100 p-4 rounded-[2rem] border border-gray-200 mb-6 shadow-inner relative group">
                <canvas ref={canvasRef} width={400} height={500} className="w-full bg-white rounded-2xl shadow-sm" />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white px-2 py-1 rounded text-[10px] font-mono">
                  {state.sourceInfo}
                </div>
                {state.keyboardFocus && (
                  <div className="absolute top-6 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-pulse">
                    <Target size={12} /> KEYBOARD ON
                  </div>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={handleCopySinglePNG} className="bg-gray-900/90 hover:bg-black text-white px-3 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur">
                    <Copy size={12} /> 복사 (PNG)
                  </button>
                  <button onClick={handleCopySingleSVG} className="bg-gray-900/90 hover:bg-black text-white px-3 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur">
                    <Copy size={12} /> 복사 (SVG)
                  </button>
                </div>
              </div>

              {/* [V43.4] 저장 버튼 그룹 */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={handleSaveToCloud}
                  disabled={isSaving}
                  className={`text-emerald-700 py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors border border-emerald-200 ${isSaving ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-emerald-50 hover:bg-emerald-100'}`}
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                  <span>개별 글자 저장</span>
                </button>
                <button
                  onClick={() => handleSaveMasterType(null, false)}
                  disabled={isSaving}
                  className={`text-blue-700 py-3 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors border border-blue-200 ${isSaving ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100'}`}
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Network size={16} />}
                  <span>유형 저장 ({state.currentData.typeKey})</span>
                </button>
              </div>

              {/* [V43.5] 개발자용: 라이브 코드 텍스트 영역 */}
              <div className="mb-6 bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                    <Terminal size={14} />
                    <span>LIVE CODE: [{state.currentData.typeKey}]</span>
                  </div>
                  <button onClick={copyLiveCode} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors">
                    COPY
                  </button>
                </div>
                <textarea
                  value={liveCode}
                  readOnly
                  className="w-full h-32 bg-slate-900 text-slate-300 text-[10px] font-mono p-3 rounded-lg outline-none resize-none custom-scrollbar focus:ring-1 focus:ring-green-500/50"
                  onClick={(e) => e.target.select()}
                />
                <div className="text-[9px] text-slate-500 mt-2 text-center">
                  * 이 코드를 복사해서 VSCode의 DEFAULT_MASTER_TYPES에 붙여넣으세요.
                </div>
              </div>

              <div className="flex gap-2 mb-8 h-14">
                <button onClick={handleCommit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95">
                  <CheckCircle2 size={18} /> {state.editingIndex >= 0 ? "수정사항 기입 (유형 자동 저장)" : "문서에 기입 (유형 자동 저장)"}
                </button>
                <button onClick={handleAutoCropDownload} className="flex-none px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black flex flex-col items-center justify-center shadow-lg shadow-amber-200 transition-all active:scale-95 group" title="단일 글자 여백제거 PNG 다운로드">
                  <Crop size={18} className="mb-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] uppercase tracking-wider">PNG</span>
                </button>
                <button onClick={handleSvgExport} className="flex-none px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black flex flex-col items-center justify-center shadow-lg shadow-purple-200 transition-all active:scale-95 group" title="단일 글자 벡터 SVG 다운로드">
                  <PenTool size={18} className="mb-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] uppercase tracking-wider">SVG</span>
                </button>
              </div>

              {/* Araea Toggle */}
              <div className={`p-4 rounded-2xl border mb-2 flex justify-between items-center transition-colors ${state.currentData.araea.active ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
                <span className="text-xs font-bold text-gray-600">아래아 (ㆍ) 활성화</span>
                <button onClick={() => dispatch({ type: 'UPDATE', sec: 'araea', val: { active: !state.currentData.araea.active } })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-colors ${state.currentData.araea.active ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>ON/OFF</button>
              </div>
              {state.currentData.araea.active && (
                <SliderPanel
                  label="아래아 (Araea)"
                  sectionKey="araea"
                  state={state}
                  dispatch={dispatch}
                  cloudMasterTypes={cloudMasterTypes}
                  setIsDragging={setIsDragging}
                  onSaveTrigger={() => handleSaveMasterType(null, true)}
                />
              )}

              {/* [V43.8] Auxiliary Vowel Toggle */}
              <div className={`p-4 rounded-2xl border mb-6 flex justify-between items-center transition-colors ${state.currentData.aux?.active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
                <span className="text-xs font-bold text-gray-600">보조 모음 (Aux) 활성화</span>
                <button onClick={() => dispatch({ type: 'UPDATE', sec: 'aux', val: { active: !state.currentData.aux.active } })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-colors ${state.currentData.aux?.active ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>ON/OFF</button>
              </div>
              {state.currentData.aux?.active && (
                <SliderPanel
                  label="보조 모음 (Auxiliary Vowel)"
                  sectionKey="aux"
                  state={state}
                  dispatch={dispatch}
                  cloudMasterTypes={cloudMasterTypes}
                  setIsDragging={setIsDragging}
                  onSaveTrigger={() => handleSaveMasterType(null, true)}
                />
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center gap-2">
                    <Type size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fine Tuning</span>
                  </div>
                  {/* [V43.9] Conflict Status */}
                  {isDragging ? (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 animate-pulse">
                      <Lock size={10} /> 편집중 (외부 동기화 차단)
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                      <Unlock size={10} /> 실시간 동기화 대기중
                    </span>
                  )}
                </div>
                {['cho', 'jung', 'jong'].map(section => (
                  <SliderPanel
                    key={section}
                    label={section === 'cho' ? '초성 (Initial)' : section === 'jung' ? '중성 (Medial)' : '종성 (Final)'}
                    sectionKey={section}
                    state={state}
                    dispatch={dispatch}
                    cloudMasterTypes={cloudMasterTypes}
                    setIsDragging={setIsDragging}
                    onSaveTrigger={() => handleSaveMasterType(null, true)}
                  />
                ))}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Network size={40} className="text-gray-400" />
              </div>
              <div>
                <p className="font-black text-lg text-gray-600 mb-2">구조 제어 시스템</p>
                <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">18가지 구조 유형을 통해<br />수천 자를 한 번에 제어하세요.</p>
              </div>
            </div>
          )}
        </main>
      </aside>

      {/* --- RIGHT: DOCUMENT AREA --- */}
      <section className="flex-1 bg-gray-200/50 p-12 overflow-auto flex flex-col items-center relative print:p-0 print:bg-white">

        <div className="w-[210mm] mb-6 flex justify-between items-center print:hidden">
          <div className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-100/50 px-3 py-1 rounded-full border border-blue-200">Parametric Design Engine Active</div>
          {state.sentence.length > 0 && (
            <div className="flex gap-2">
              <button onClick={exportSentencePNG} className="bg-white border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                <Crop size={14} /> 문장 PNG 추출
              </button>
              <button onClick={exportSentenceSVG} className="bg-white border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all">
                <PenTool size={14} /> 문장 SVG 추출
              </button>
            </div>
          )}
        </div>

        {/* A4 Paper */}
        <div className="print-area w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] flex flex-wrap content-start gap-y-4 gap-x-2 relative transition-all duration-300">
          <div className="w-full border-b-2 border-black pb-4 mb-10 flex justify-between items-end opacity-80">
            <span className="text-3xl font-serif font-bold">NURI</span>
            <span className="text-xs font-serif text-gray-500 tracking-widest uppercase">Typesetting Engine v43.9 (Structure-Based)</span>
          </div>

          {state.sentence.map((s, i) => (
            <div key={i} className="group relative" onClick={() => !s.isSpace && dispatch({ type: 'SELECT', idx: i })}>
              {s.isSpace ? (
                <div className="w-[10mm] h-[20mm] hover:bg-blue-50/50 transition-colors rounded" />
              ) : (
                <>
                  <div className={`w-[16mm] h-[28mm] flex-none flex items-center justify-center cursor-pointer hover:ring-2 ring-blue-500 rounded transition-all ${state.editingIndex === i ? 'ring-4 ring-blue-500 bg-blue-50/30' : ''}`}>
                    <VectorGlyph data={s.data} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_ITEM', idx: i }); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 print:hidden"
                  >
                    <Trash2 size={10} />
                  </button>
                </>
              )}
            </div>
          ))}

          <div className="w-[2px] h-[24mm] bg-blue-500 animate-pulse ml-1 mt-2 print:hidden"></div>
        </div>

        <div className="fixed-buttons fixed bottom-10 right-10 flex gap-4 z-50 print:hidden">
          <button onClick={() => dispatch({ type: 'ADD_SPACE' })} className="px-6 py-4 bg-gray-900 text-white rounded-full shadow-2xl shadow-gray-400/50 font-bold flex items-center gap-2 hover:bg-black transition-colors">
            <SpaceIcon size={18} /> 공백
          </button>
          <button onClick={exportAsJPG} className="px-6 py-4 bg-white text-gray-900 rounded-full shadow-2xl shadow-gray-400/50 font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors border border-gray-100">
            <ImageIcon size={18} /> JPG 출력
          </button>
        </div>
      </section>
    </div>
  );
}

