with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update updateVal in keydown to autotab
target_keydown = """              if (['gunX', 'gunY', 'tgtX', 'tgtY'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {"""
new_keydown = """              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length > 4) return prev;
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
      }
      if (e.key === '.'"""
      
# Actually wait, `e.key === '.'` is the next block. I should just use regex or exact replacement.
# Let's replace the whole inner block
keydown_replace_match = """              if (['gunX', 'gunY', 'tgtX', 'tgtY'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {
                  if (e.key === '0') return '';
                  if (/^[1-5]$/.test(e.key)) return e.key;
                  return prev;
              }
              return nextVal;
          });
      }"""
keydown_replace_new = """              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length > 4) return prev;
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
content = content.replace(keydown_replace_match, keydown_replace_new)

keypad_replace_match = """              if (['gunX', 'gunY', 'tgtX', 'tgtY'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              if (activeField === 'charge') {
                  if (val === '0') return '';
                  if (/^[1-5]$/.test(val)) return val;
                  return prev;
              }
              return nextVal;
          });
      }"""
keypad_replace_new = """              if (['gunX', 'gunY', 'tgtX', 'tgtY', 'gunElev', 'tgtElev'].includes(activeField) && nextVal.length > 4) return prev;
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
content = content.replace(keypad_replace_match, keypad_replace_new)

# 2. Update TerminalField placeholder logic
tf_match = "      const strVal = String(val || '');"
tf_new = "      const strVal = String(val === '' || val === undefined || val === null ? '-' : val);"
content = content.replace(tf_match, tf_new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
