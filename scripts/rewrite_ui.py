import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    original = f.read()

content = original

# 1. Add activeField to state
state_search = "  const [canvasRef] = useState<HTMLCanvasElement | null>(null);" # I'll just find canvasRef=useRef...
state_insert_point = "  const canvasRef = useRef<HTMLCanvasElement>(null);\n"

new_state = """
  const [activeField, setActiveField] = useState<string | null>(null);

  // Global keydown listener for virtual terminal inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeField) return;
      
      const updateVal = (updater: (prev: string) => string) => {
        if (activeField === 'gunX') setGunX(updater);
        if (activeField === 'gunY') setGunY(updater);
        if (activeField === 'tgtX') setTgtX(updater);
        if (activeField === 'tgtY') setTgtY(updater);
        if (activeField === 'gunElev') setGunElevStr(updater);
        if (activeField === 'tgtElev') setTgtElevStr(updater);
        if (activeField === 'windSpeed') setWindSpeed(updater);
        if (activeField === 'windDir') setWindDir(updater);
      };

      if (e.key === 'Backspace') {
          e.preventDefault();
          updateVal(prev => prev.slice(0, -1));
          return;
      }
      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => prev + e.key);
      }
      if (e.key === '.' && ['gunElev', 'tgtElev', 'windSpeed', 'windDir'].includes(activeField)) {
          e.preventDefault();
          updateVal(prev => prev.includes('.') ? prev : prev + '.');
      }
      if (e.key === 'Enter') {
          e.preventDefault();
          setActiveField(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeField]);

  const handleKeypadPress = (val: string) => {
      if (!activeField) return;
      const updateVal = (updater: (prev: string) => string) => {
        if (activeField === 'gunX') setGunX(updater);
        if (activeField === 'gunY') setGunY(updater);
        if (activeField === 'tgtX') setTgtX(updater);
        if (activeField === 'tgtY') setTgtY(updater);
        if (activeField === 'gunElev') setGunElevStr(updater);
        if (activeField === 'tgtElev') setTgtElevStr(updater);
        if (activeField === 'windSpeed') setWindSpeed(updater);
        if (activeField === 'windDir') setWindDir(updater);
      };
      if (val === 'DEL') {
          updateVal(prev => prev.slice(0, -1));
      } else {
          updateVal(prev => prev + val);
      }
  };

  const TerminalField = ({ id, label, val }: {id: string, label: string, val: string}) => {
      const isActive = activeField === id;
      return (
          <div 
              style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : 0.7 }}
              onClick={() => setActiveField(id)}
          >
              <span style={{ fontSize: '14px', width: '30px' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--term-fg)', backgroundColor: isActive ? 'transparent' : 'transparent', fontWeight: isActive ? 'bold' : 'normal' }}>
                      {val || (isActive ? '' : '-')}
                  </span>
                  {isActive && <span style={{ animation: 'blinker 1s step-end infinite', backgroundColor: 'var(--term-fg)', width: '8px', height: '14px', marginLeft: '2px', display: 'inline-block' }} />}
              </div>
          </div>
      );
  };
"""

content = content.replace(state_insert_point, state_insert_point + new_state)

# 2. Extract and remove the old BDT block
bdt_start = "                 {showBDT && ("
bdt_end = "                       </div>\n                  )}"
idx1 = content.find(bdt_start)
idx2 = content.find(bdt_end, idx1) + len(bdt_end)
old_bdt_block = content[idx1:idx2]
content = content[:idx1] + content[idx2:]

# 3. Restyle and rebuild the new sidebar cluster replacing dpads-sidebar entirely
dpad_search_start = "             {showDPad && (\n                 <div className=\"dpads-sidebar\">"
dpad_search_end = "                 </div>\n             )}"
dpad_idx1 = content.find(dpad_search_start)
dpad_idx2 = content.find(dpad_search_end, dpad_idx1) + len(dpad_search_end)

new_cluster = """             {(showDPad || showCoordsInput || showBDT) && (
                 <div className="dpads-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '180px' }}>
                     
                     {/* DPAD & KEYPAD ROW */}
                     {showDPad && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                         {/* DPAD */}
                         <div className="dpad-item">
                             <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>{dpadMode === 'PAN' && zoomMode === 'OFF' ? 'N/A' : dpadMode}</div>
                             <div className="dpad-grid">
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'N'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'N'); else if (dpadMode === 'ADJUST') handleAdjust('N'); else if (dpadMode === 'PAN') handlePan('N'); }}>▲</RepeatButton>
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'W'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'W'); else if (dpadMode === 'ADJUST') handleAdjust('W'); else if (dpadMode === 'PAN') handlePan('W'); }}>◀</RepeatButton>
                                 {dpadMode === 'ADJUST' ? <button onClick={handleResetAdjust} className="dpad-btn dpad-btn-reset" style={{ marginTop: 0 }}>⨯</button> : <div />}
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'E'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'E'); else if (dpadMode === 'ADJUST') handleAdjust('E'); else if (dpadMode === 'PAN') handlePan('E'); }}>▶</RepeatButton>
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'S'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'S'); else if (dpadMode === 'ADJUST') handleAdjust('S'); else if (dpadMode === 'PAN') handlePan('S'); }}>▼</RepeatButton>
                                 <div />
                             </div>
                             <button style={{ background: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', cursor: 'pointer', fontSize: '10px', padding: '2px', marginTop: '4px', width: '100%' }} onClick={() => { if (dpadMode === 'TGT') setDpadMode('GUN'); else if (dpadMode === 'GUN') setDpadMode('ADJUST'); else if (dpadMode === 'ADJUST') setDpadMode('PAN'); else setDpadMode('TGT'); }}>MODE</button>
                         </div>
                         
                         {/* KEYPAD */}
                         <div className="dpad-item">
                             <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '4px' }}>KEYPAD</div>
                             <div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(4, 26px)', gap: '2px' }}>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('7')}>7</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('8')}>8</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('9')}>9</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('4')}>4</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('5')}>5</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('6')}>6</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('1')}>1</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('2')}>2</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('3')}>3</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('.')}>.</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('0')}>0</RepeatButton>
                                 <button className="dpad-btn dpad-btn-reset" style={{fontSize: '10px', borderStyle: 'solid'}} onClick={() => handleKeypadPress('DEL')}>DEL</button>
                             </div>
                         </div>
                     </div>
                     )}

                     {/* TERMINAL INPUTS */}
                     {showCoordsInput && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed var(--term-border)', paddingBottom: '12px' }}>
                             <TerminalField id="gunX" label="GX" val={gunX} />
                             <TerminalField id="gunY" label="GY" val={gunY} />
                             <TerminalField id="gunElev" label="GZ" val={gunElevStr} />
                             <div style={{ height: '4px' }} />
                             <TerminalField id="tgtX" label="TX" val={tgtX} />
                             <TerminalField id="tgtY" label="TY" val={tgtY} />
                             <TerminalField id="tgtElev" label="TZ" val={tgtElevStr} />
                             <div style={{ height: '4px' }} />
                             <TerminalField id="windSpeed" label="WS" val={windSpeed} />
                             <TerminalField id="windDir" label="WD" val={windDir} />
                             <div style={{ height: '4px' }} />
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                 <span style={{ fontSize: '14px', width: '30px' }}>CH</span>
                                 <select 
                                     value={forcedCharge === null ? 'AUTO' : forcedCharge.toString()}
                                     onChange={(e) => setForcedCharge(e.target.value === 'AUTO' ? null : parseInt(e.target.value))}
                                     style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--term-border)', color: 'var(--term-fg)', fontFamily: 'inherit', padding: '2px', outline: 'none', textAlign: 'right' }}
                                 >
                                     <option value="AUTO" style={{ background: 'var(--term-bg)' }}>AUTO</option>
                                     <option value="1" style={{ background: 'var(--term-bg)' }}>CH 1</option>
                                     <option value="2" style={{ background: 'var(--term-bg)' }}>CH 2</option>
                                     <option value="3" style={{ background: 'var(--term-bg)' }}>CH 3</option>
                                     <option value="4" style={{ background: 'var(--term-bg)' }}>CH 4</option>
                                     <option value="5" style={{ background: 'var(--term-bg)' }}>CH 5</option>
                                 </select>
                             </div>
                         </div>
                     )}

                     {/* BDT */}
                     {showBDT && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '14px', lineHeight: '1.4', color: 'var(--term-fg)' }}>
                             {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
                                 <div style={{ color: '#ffbb00', marginBottom: '8px', fontSize: '12px' }}>{calculation.message}</div>
                             )}
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>RNG</span><span>{gridData ? gridData.range : '----'} M</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>ADJ</span><span>{adjStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>CHG</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{chargeStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>AZ</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{azDegStr}° / {azMilStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>EL</span><span style={{ backgroundColor: 'var(--term-fg)', color: 'var(--term-bg)', padding: '0 4px', fontWeight: 'bold' }}>{elDegStr}° / {elMilStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--term-border)', marginTop: '4px', paddingTop: '4px' }}><span>TOF</span><span>{tofStr}s</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><span>DISP</span><span>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion}` : '--'} M</span></div>
                         </div>
                     )}

                 </div>
             )}"""

content = content[:dpad_idx1] + new_cluster + content[dpad_idx2:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Rewrite UI successful.")
