import React from 'react';

export default function SceneArt({ sceneType }) {
  const scenes = {
    library: { wall: '#d6c7ad', floor: '#87674e', accent: '#bd8e47', label: 'Perpustakaan Al-Hikmah' },
    laboratory: { wall: '#d5e8e7', floor: '#698c91', accent: '#39a4bd', label: 'Laboratorium sekolah' },
    office: { wall: '#d8d9e7', floor: '#756e8c', accent: '#8b78c5', label: 'Ruang kepala sekolah' },
    cafeteria: { wall: '#f0d8b9', floor: '#b37a55', accent: '#e1a15a', label: 'Kantin dan area pameran' }
  };
  const s = scenes[sceneType] ?? scenes.library;
  return (
    <svg className="scene-art" viewBox="0 0 800 450" role="img" aria-label={`Ilustrasi ${s.label}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`wall-${sceneType}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.wall} />
          <stop offset="100%" stopColor="#f5eee2" />
        </linearGradient>
        <linearGradient id={`floor-${sceneType}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={s.floor} />
          <stop offset="100%" stopColor="#443f4b" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill={`url(#wall-${sceneType})`} />
      <rect y="330" width="800" height="120" fill={`url(#floor-${sceneType})`} />
      <path d="M0 330 L800 330" stroke="#ffffff" strokeOpacity=".5" strokeWidth="5" />
      <rect x="44" y="42" width="155" height="110" rx="8" fill="#f9f4e9" stroke="#6f7479" strokeWidth="8" />
      <path d="M121 45 V149 M48 96 H196" stroke="#879aa5" strokeWidth="5" />
      <path d="M45 45 L198 150 M198 45 L45 150" stroke="#879aa5" strokeWidth="2" opacity=".25" />
      {sceneType === 'library' && <g>
        <rect x="235" y="52" width="200" height="218" rx="8" fill="#6e4c35" />
        {[0,1,2].map((n) => <g key={n}><rect x="249" y={68+n*62} width="171" height="7" fill="#caa36a" />{[0,1,2,3,4,5,6].map((k)=><rect key={k} x={254+k*23} y={79+n*62} width="14" height="42" rx="2" fill={['#8d563c','#c78d53','#5c736d','#d8bc83','#745a81','#9e7650','#47656a'][k]} />)}</g>)}
        <rect x="510" y="210" width="205" height="30" rx="5" fill="#6b4933" /><rect x="530" y="240" width="12" height="90" fill="#6b4933" /><rect x="680" y="240" width="12" height="90" fill="#6b4933" />
        <rect x="560" y="190" width="70" height="19" rx="3" fill="#f4e5bd" transform="rotate(-8 560 190)" /><path d="M570 198 h40 M574 203 h32" stroke="#987b56" strokeWidth="2" />
        <rect x="345" y="278" width="120" height="42" rx="5" fill="#b18b61" /><rect x="355" y="317" width="12" height="34" fill="#674a37" /><rect x="443" y="317" width="12" height="34" fill="#674a37" />
      </g>}
      {sceneType === 'laboratory' && <g>
        <rect x="230" y="180" width="490" height="28" rx="5" fill="#f3f4ef" stroke="#6e8e91" strokeWidth="4" /><rect x="255" y="207" width="18" height="128" fill="#466c73" /><rect x="680" y="207" width="18" height="128" fill="#466c73" />
        <rect x="275" y="92" width="135" height="72" rx="8" fill="#b2d4d9" stroke="#5f858e" strokeWidth="5" /><path d="M342 92 v72 M275 128 h135" stroke="#f2ffff" strokeWidth="4" />
        <g stroke="#527c87" strokeWidth="4"><path d="M318 150 v-34 h19 v34 q0 12 -10 12 q-9 0 -9 -12Z" fill="#54a6c6"/><path d="M365 150 v-34 h19 v34 q0 12 -10 12 q-9 0 -9 -12Z" fill="#e0b55e"/><path d="M440 160 l16 -26 l16 26" fill="none"/><rect x="437" y="158" width="38" height="10" rx="4" fill="#536e79"/></g>
        <rect x="530" y="70" width="150" height="85" rx="7" fill="#eff6f2" stroke="#658c91" strokeWidth="5" /><path d="M550 90 h110 M550 108 h70 M550 126 h90" stroke="#6c999d" strokeWidth="4" />
        <rect x="480" y="250" width="145" height="45" rx="8" fill="#2b5c6c" /><rect x="492" y="260" width="120" height="8" rx="4" fill="#a9d5da" /><rect x="510" y="296" width="10" height="34" fill="#2b5c6c" /><rect x="590" y="296" width="10" height="34" fill="#2b5c6c" />
      </g>}
      {sceneType === 'office' && <g>
        <rect x="255" y="68" width="240" height="190" rx="8" fill="#786b7c" /><rect x="272" y="86" width="205" height="46" rx="3" fill="#d4c7a8" />
        {[0,1,2,3].map((n)=><g key={n}><rect x={280+n*48} y="92" width="35" height="32" rx="3" fill={['#8a634a','#c6a45f','#5c737d','#b77b5a'][n]} /></g>)}
        <rect x="272" y="148" width="205" height="90" rx="3" fill="#554a5d" /><path d="M288 166 h170 M288 184 h135 M288 202 h155" stroke="#c4b8c8" strokeWidth="5" />
        <rect x="525" y="208" width="205" height="27" rx="4" fill="#665466" /><rect x="545" y="235" width="12" height="98" fill="#514457" /><rect x="700" y="235" width="12" height="98" fill="#514457" />
        <circle cx="642" cy="95" r="43" fill="#fff5dc" stroke="#67586b" strokeWidth="8" /><path d="M642 95 L642 68 M642 95 L663 106" stroke="#6c596f" strokeWidth="5" strokeLinecap="round" />
        <rect x="560" y="180" width="80" height="24" rx="3" fill="#e3d5b2" transform="rotate(-6 560 180)" /><path d="M572 188 h48 M572 195 h38" stroke="#a78e67" strokeWidth="2" />
      </g>}
      {sceneType === 'cafeteria' && <g>
        <rect x="230" y="192" width="225" height="24" rx="6" fill="#9c5e3b" /><rect x="246" y="216" width="14" height="113" fill="#70442f" /><rect x="423" y="216" width="14" height="113" fill="#70442f" />
        <rect x="270" y="158" width="120" height="34" rx="6" fill="#d6a46a" /><path d="M286 169 h88 M286 180 h65" stroke="#875739" strokeWidth="3" />
        <rect x="520" y="172" width="150" height="24" rx="5" fill="#87553d" /><rect x="533" y="196" width="13" height="136" fill="#5b3f31" /><rect x="645" y="196" width="13" height="136" fill="#5b3f31" />
        <rect x="540" y="118" width="112" height="45" rx="7" fill="#f8ebd0" stroke="#986d4d" strokeWidth="4" /><path d="M555 132 h82 M555 143 h58" stroke="#ba9369" strokeWidth="3" />
        <circle cx="620" cy="72" r="32" fill="#fff2c9" stroke="#9c6746" strokeWidth="7" /><path d="M620 72 L620 50 M620 72 L637 81" stroke="#895a3d" strokeWidth="4" strokeLinecap="round" />
        <rect x="475" y="263" width="80" height="58" rx="14" fill="#4c6876" /><path d="M488 263 q26 -28 52 0" stroke="#a8c5cd" strokeWidth="7" fill="none" /><rect x="487" y="285" width="55" height="9" rx="4" fill="#a8c5cd" />
      </g>}
      <rect x="24" y="374" width="752" height="52" rx="10" fill="#101c31" fillOpacity=".88" />
      <text x="45" y="406" fontSize="18" fontWeight="700" fill="#f6e5be" letterSpacing="2">BASYIR AGENCY</text>
      <text x="755" y="405" fontSize="14" fontWeight="600" textAnchor="end" fill="#ffffff" opacity=".88">TKP • {s.label}</text>
      <g opacity=".55"><circle cx="748" cy="48" r="18" fill={s.accent} /><path d="M748 35 a13 13 0 1 0 13 19 a12 12 0 0 1 -13 -19" fill="#f9f3e6" /></g>
    </svg>
  );
}
