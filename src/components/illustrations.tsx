/** Original schematic SVG artwork. Meaning is supplied by the adjacent headings. */
export function FinancialDiagram({ kind }: { kind: "salary" | "enquiry" | "conversation" }) {
  return <svg viewBox="0 0 200 128" fill="none" aria-hidden="true" focusable="false" className="financial-diagram">
    <path d="M20 108h160M20 20v88" stroke="#D5DDD6" strokeWidth="1" />
    {kind === "salary" ? <>
      <rect x="48" y="17" width="88" height="91" rx="4" fill="#FAF9F6" stroke="#132C44" strokeWidth="1.5" />
      <path d="M48 39h88" stroke="#D5DDD6" /><rect x="58" y="26" width="16" height="5" rx="1" fill="#B65320" />
      <path d="M82 29h36M62 52h25M62 60h47M62 81h23M62 89h33" stroke="#8D9D94" strokeWidth="2" />
      <g className="diagram-accent diagram-salary"><rect x="110" y="68" width="48" height="41" rx="4" fill="#E4ECE4" stroke="#607C6B" strokeWidth="1.5" />
      <path d="M122 78h21m-21 6h21m-18-6q22 3 0 17l14 10" stroke="#42614F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      <path d="M145 28h19v27h-19" stroke="#9CAB9F" strokeWidth="1.2" strokeDasharray="3 3" />
    </> : kind === "enquiry" ? <>
      <rect x="54" y="17" width="91" height="91" rx="4" fill="#FAF9F6" stroke="#132C44" strokeWidth="1.5" />
      <path d="M67 31h32" stroke="#132C44" strokeWidth="2" /><path d="M67 38h54" stroke="#9CAB9F" strokeWidth="1.5" />
      <rect x="67" y="49" width="65" height="13" rx="2" fill="#E8EDE5" stroke="#C4D0C6" />
      <rect x="67" y="69" width="29" height="13" rx="2" stroke="#C4D0C6" /><rect x="103" y="69" width="29" height="13" rx="2" stroke="#C4D0C6" />
      <path d="M72 55h26m-26 20h15m21 0h15" stroke="#91A094" strokeWidth="1.5" />
      <path d="M68 95h36" stroke="#B65320" strokeWidth="3" />
      <g className="diagram-accent diagram-pencil"><path d="m137 96 24-24 8 8-24 24-11 3z" fill="#F2D9C5" stroke="#B65320" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m157 76 8 8" stroke="#B65320" strokeWidth="1.5" /></g><path d="M31 42h13m-13 6h13m-11-6q12 2 0 11l9 7" stroke="#607C6B" strokeWidth="1.4" />
    </> : <>
      <rect x="57" y="17" width="53" height="92" rx="7" fill="#FAF9F6" stroke="#132C44" strokeWidth="1.5" />
      <path d="M75 24h17M78 101h12" stroke="#607C6B" strokeWidth="2" strokeLinecap="round" />
      <rect x="65" y="34" width="37" height="55" rx="2" fill="#E8EDE5" />
      <path d="M82 47h-5q-3 19 16 26l4-6-8-6-3 4q-5-3-5-8l4-2z" fill="#607C6B" />
      <g className="diagram-accent diagram-bubble"><path d="M124 43h43v30h-25l-10 9v-9h-8z" fill="#FAF9F6" stroke="#B65320" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M134 54h23m-23 8h15" stroke="#B65320" strokeWidth="1.5" /></g>
      <path d="M117 94h30V85M44 52H32v36h17" stroke="#9CAB9F" strokeWidth="1.2" strokeDasharray="3 3" />
    </>}
  </svg>;
}

export function PurposeIllustration({ kind }: { kind: "home" | "learning" | "occasion" }) {
  return <svg viewBox="0 0 320 190" fill="none" aria-hidden="true" focusable="false" className="purpose-art">
    <path d="M37 161h246M37 33v128" stroke="#CAD5CB" strokeWidth="1" />
    {kind === "home" ? <>
      <path d="M79 151V42h155v109h-64m-27 0H79" stroke="#132C44" strokeWidth="2" strokeLinejoin="round" />
      <path d="M88 143V51h137v92h-55" stroke="#A0B0A3" /><path d="M143 151v-27q27 0 27 27" stroke="#A0B0A3" strokeWidth="1.3" />
      <path d="M113 42h42m-42 4h42" stroke="#B65320" strokeWidth="3" />
      <rect x="96" y="66" width="48" height="51" rx="3" fill="#E4ECE2" stroke="#607C6B" strokeWidth="1.5" />
      <path d="M96 78h48m-39 0v31m30-31v31" stroke="#9CAB9F" />
      <rect x="169" y="68" width="38" height="38" rx="3" fill="#FAF9F6" stroke="#607C6B" strokeWidth="1.5" />
      <circle cx="188" cy="87" r="9" stroke="#B65320" strokeWidth="1.5" />
      <path d="M79 26h155m-155-4v8m155-8v8M249 42v109m-4-109h8m-8 109h8" stroke="#91A293" strokeWidth="1.2" />
    </> : kind === "learning" ? <>
      <rect x="67" y="42" width="152" height="101" rx="4" fill="#FAF9F6" stroke="#132C44" strokeWidth="2" />
      <path d="M67 60h152M128 143v16m30-16v16m-46 0h62" stroke="#132C44" strokeWidth="1.5" />
      <circle cx="78" cy="51" r="2" fill="#B65320" /><circle cx="86" cy="51" r="2" fill="#A2B4A5" />
      <rect x="81" y="74" width="48" height="52" rx="2" fill="#E4ECE2" /><path d="m99 89 15 11-15 11z" stroke="#607C6B" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M142 79h61m-61 10h44m-44 18h61m-61 9h35" stroke="#9CAB9F" strokeWidth="2" />
      <rect x="197" y="99" width="47" height="60" rx="3" fill="#F6E9DC" stroke="#B65320" strokeWidth="1.5" transform="rotate(8 197 99)" />
      <path d="m209 111 24 4m-25 5 24 4m-25 5 17 3" stroke="#B65320" strokeWidth="1.5" />
    </> : <>
      <rect x="78" y="41" width="104" height="111" rx="4" fill="#FAF9F6" stroke="#132C44" strokeWidth="1.5" />
      <path d="M78 65h104M98 33v16m64-16v16" stroke="#132C44" strokeWidth="1.5" />
      <path d="M94 80h10m14 0h10m14 0h10m14 0h4m-76 16h10m14 0h10m14 0h10m-58 16h10m14 0h10" stroke="#A0B0A3" strokeWidth="3" />
      <rect x="139" y="88" width="96" height="66" rx="3" fill="#F6E9DC" stroke="#B65320" strokeWidth="1.5" />
      <path d="m140 91 47 35 47-35m-94 61 34-31m60 31-34-31" stroke="#B65320" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="187" cy="123" r="6" fill="#B65320" />
      <path d="M204 55h36m-36 7h25" stroke="#9CAB9F" strokeWidth="1.5" />
    </>}
  </svg>;
}
