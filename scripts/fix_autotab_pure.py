with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useEffect dependencies
dep_match = "  }, [activeField]);"
dep_new = "  }, [activeField, gunX, gunY, gunElevStr, tgtX, tgtY, tgtElevStr, windSpeed, windDir, forcedChargeStr]);"
content = content.replace(dep_match, dep_new)

# 2. Update handleKeyDown body
keydown_match = """      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => {
              const nextVal = prev + e.key;
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {
                  if (e.key === '0') return '';
                  if (/^[1-5]$/.test(e.key)) return e.key;
                  return prev;
              }
              if (nextVal.length === 4 && ['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField)) {
                  setTimeout(() => {
                      setActiveField(pf => {
                          const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];
                          const idx = fields.indexOf(pf || '');
                          if (idx !== -1) return fields[(idx + 1) % fields.length];
                          return null;
                      });
                  }, 0);
              }
              return nextVal;
          });
      }"""

keydown_new = """      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          const currVals: Record<string, string> = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr };
          const prevStr = currVals[activeField] || '';
          const nextVal = prevStr + e.key;
          let willTab = false;
          
          if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length === 4) willTab = true;
          if (activeField === 'windDir' && nextVal.length === 3) willTab = true;
          if (activeField === 'charge' && /^[1-5]$/.test(e.key)) willTab = true;

          updateVal(prev => {
              const nv = prev + e.key;
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nv.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nv) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nv) > 360) return '360';
              if (activeField === 'charge') {
                  if (e.key === '0') return '';
                  if (/^[1-5]$/.test(e.key)) return e.key;
                  return prev;
              }
              return nv;
          });
          
          if (willTab) {
              const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];
              const idx = fields.indexOf(activeField);
              if (idx !== -1) setActiveField(fields[(idx + 1) % fields.length]);
          }
      }"""
content = content.replace(keydown_match, keydown_new)

# 3. Update handleKeypadPress body
keypad_match = """      } else {
          updateVal(prev => {
              const nextVal = prev + val;
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              if (nextVal.length === 4 && ['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField)) {
                  setTimeout(() => {
                      setActiveField(pf => {
                          const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];
                          const idx = fields.indexOf(pf || '');
                          if (idx !== -1) return fields[(idx + 1) % fields.length];
                          return null;
                      });
                  }, 0);
              }
              return nextVal;
          });
      }"""

keypad_new = """      } else {
          const currVals: Record<string, string> = { gunX, gunY, gunElev: gunElevStr, tgtX, tgtY, tgtElev: tgtElevStr, windSpeed, windDir, charge: forcedChargeStr };
          const prevStr = currVals[activeField] || '';
          const nextVal = prevStr + val;
          let willTab = false;
          
          if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length === 4) willTab = true;
          if (activeField === 'windDir' && nextVal.length === 3) willTab = true;
          if (activeField === 'charge' && /^[1-5]$/.test(val)) willTab = true;

          updateVal(prev => {
              const nv = prev + val;
              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nv.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nv) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nv) > 360) return '360';
              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              return nv;
          });
          
          if (willTab) {
              const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir', 'charge'];
              const idx = fields.indexOf(activeField);
              if (idx !== -1) setActiveField(fields[(idx + 1) % fields.length]);
          }
      }"""
content = content.replace(keypad_match, keypad_new)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
