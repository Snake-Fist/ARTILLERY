with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add showBDT state after showDPad
content = content.replace(
    "  const [showDPad, setShowDPad] = useState<boolean>(true);",
    "  const [showDPad, setShowDPad] = useState<boolean>(true);\n  const [showBDT, setShowBDT] = useState<boolean>(true);"
)

# 2. Remove the standalone results-section div (lines 800-858 roughly)
old_results = '''          <div className="results-section" style={{ paddingTop: '10px', borderTop: '2px dashed var(--term-border)', order: 3, display: 'flex', flexDirection: 'column' }}>
        {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
            <div className="alert">{calculation.message}</div>
        )}
        
        <div className="result-row">
            <span>TGT (RANGE):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{gridData ? gridData.range : '----'} M</div>
                <div>{' '}</div>
            </div>
        </div>

        <div className="result-row" style={{ borderBottom: '1px dashed var(--term-border)', paddingBottom: '10px', marginBottom: '10px' }}>
            <span>A (ADJUST):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{adjStr}</div>
                <div>{' '}</div>
            </div>
        </div>

        <div className="result-row">
            <span>C (CHARGE):</span>
            <div style={{ textAlign: 'right' }}>
                <div style={{ color: forcedCharge ? '#fff' : 'inherit' }}>CHG {chargeStr}</div>
                <div>{' '}</div>
            </div>
        </div>

        <div className="result-row" style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '10px' }}>
            <span>X (AZIMUTH):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{azMilStr} MILS</div>
                <div>{azDegStr}°</div>
            </div>
        </div>
        
        <div className="result-row">
            <span>Y (ELEVATION):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{elMilStr} MILS</div>
                <div>{elDegStr}°</div>
            </div>
        </div>

        <div className="result-row">
            <span>T (FLIGHT):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{tofStr} SEC</div>
            </div>
        </div>

        <div className="result-row" style={{ borderTop: '1px dashed var(--term-border)', paddingTop: '10px' }}>
            <span>D (DISPERSION):</span>
            <div style={{ textAlign: 'right' }}>
                <div>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion} M` : '-- M'}</div>
            </div>
        </div>
      </div>'''

new_results = ''  # Remove from here

content = content.replace(old_results, new_results)

# 3. Place BDT overlay inside the map canvas wrapper, after {timerRender}
old_timer_line = "                     {timerRender}\n                 </div>"
new_overlay = '''                     {timerRender}

                     {showBDT && (
                         <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 10, fontSize: '7px', lineHeight: '1.4', color: 'var(--term-text)', fontFamily: 'inherit', pointerEvents: 'none' }}>
                             {!calculation.valid && calculation.message !== 'WAITING FOR DATA...' && (
                                 <div style={{ color: '#ff4444', marginBottom: '2px' }}>{calculation.message}</div>
                             )}
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>RNG</span><span>{gridData ? gridData.range : '----'} M</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>ADJ</span><span>{adjStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--term-border)', marginTop: '2px', paddingTop: '2px' }}><span>CHG</span><span>{chargeStr}</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>AZ</span><span>{azMilStr} / {azDegStr}°</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>EL</span><span>{elMilStr} / {elDegStr}°</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span>TOF</span><span>{tofStr}s</span></div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--term-border)', marginTop: '2px', paddingTop: '2px' }}><span>DISP</span><span>{calculation.valid && calculation.dispersion ? `~${calculation.dispersion}` : '--'} M</span></div>
                         </div>
                     )}
                 </div>'''

content = content.replace(old_timer_line, new_overlay)

# 4. Add SHOW BDT toggle in the MAP mode right bezel, after SHOW DPAD button
old_dpad_btn = '''                    <button
                        className={`osb-button ${showDPad ? 'active' : ''}`}
                        onClick={() => setShowDPad(!showDPad)}
                        style={{ borderStyle: showDPad ? 'solid' : 'dashed' }}
                    >
                        {showDPad ? 'HIDE DPAD' : 'SHOW DPAD'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}'''

new_dpad_btn = '''                    <button
                        className={`osb-button ${showDPad ? 'active' : ''}`}
                        onClick={() => setShowDPad(!showDPad)}
                        style={{ borderStyle: showDPad ? 'solid' : 'dashed' }}
                    >
                        {showDPad ? 'HIDE DPAD' : 'SHOW DPAD'}
                    </button>
                    <button
                        className={`osb-button ${showBDT ? 'active' : ''}`}
                        onClick={() => setShowBDT(!showBDT)}
                        style={{ borderStyle: showBDT ? 'solid' : 'dashed' }}
                    >
                        {showBDT ? 'HIDE BDT' : 'SHOW BDT'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}'''

content = content.replace(old_dpad_btn, new_dpad_btn)

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
