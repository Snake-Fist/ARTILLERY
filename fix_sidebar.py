with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '        <div className="mfd-sidebar right">'
end_marker = '        </div>\n      </div>\n    </div>'

start_idx = content.index(start_marker)
end_idx = content.index(end_marker) + len('        </div>')

new_sidebar = '''        <div className="mfd-sidebar right">
            {activePage === 'MAP' ? (
                <>
                    <button
                        className={`osb-button ${mapMode === 'gun' ? 'active' : ''}`}
                        onClick={() => setMapMode('gun')}
                        style={{ borderStyle: mapMode === 'gun' ? 'solid' : 'dashed' }}
                    >
                        {mapMode === 'gun' ? 'SETN GUN' : 'SET GUN'}
                    </button>
                    <button
                        className={`osb-button ${mapMode === 'tgt' ? 'active' : ''}`}
                        onClick={() => setMapMode('tgt')}
                        style={{ borderStyle: mapMode === 'tgt' ? 'solid' : 'dashed' }}
                    >
                        {mapMode === 'tgt' ? 'SETN TGT' : 'SET TGT'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={handleCommitAdj}
                        disabled={!adjN && !adjS && !adjE && !adjW}
                        style={{
                            opacity: (adjN || adjS || adjE || adjW) ? 1 : 0.2,
                            borderStyle: (adjN || adjS || adjE || adjW) ? 'solid' : 'dashed'
                        }}
                    >
                        COMMIT<br/>ADJ
                    </button>
                    <button
                        className={`osb-button ${showDPad ? 'active' : ''}`}
                        onClick={() => setShowDPad(!showDPad)}
                        style={{ borderStyle: showDPad ? 'solid' : 'dashed' }}
                    >
                        {showDPad ? 'HIDE DPAD' : 'SHOW DPAD'}
                    </button>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}
                        disabled={!calculation.valid || fireStart !== null}
                        style={{
                            opacity: (calculation.valid && fireStart === null) ? 1 : 0.2,
                            borderStyle: (calculation.valid && fireStart === null) ? 'solid' : 'dashed'
                        }}
                    >
                        FIRE
                    </button>
                </>
            ) : (
                <>
                    <button
                        className="osb-button"
                        onClick={calculation.valid && fireStart === null ? handleFire : undefined}
                        disabled={!calculation.valid || fireStart !== null}
                        style={{
                            opacity: (calculation.valid && fireStart === null) ? 1 : 0.2,
                            borderStyle: (calculation.valid && fireStart === null) ? 'solid' : 'dashed'
                        }}
                    >
                        FIRE
                    </button>
                    <button
                        className="osb-button"
                        onClick={handleCommitAdj}
                        disabled={!adjN && !adjS && !adjE && !adjW}
                        style={{
                            opacity: (adjN || adjS || adjE || adjW) ? 1 : 0.2,
                            borderStyle: (adjN || adjS || adjE || adjW) ? 'solid' : 'dashed'
                        }}
                    >
                        COMMIT<br/>ADJ
                    </button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>DATA</button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>SYS</button>
                    <button className="osb-button" style={{ opacity: 0.2 }} disabled>MENU</button>
                </>
            )}
            <div style={{ flex: 1 }} />
        </div>'''

content = content[:start_idx] + new_sidebar + content[end_idx:]

with open(r'h:\_PROJECTS\ARTILLERY\src\App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - sidebar rewritten successfully')
