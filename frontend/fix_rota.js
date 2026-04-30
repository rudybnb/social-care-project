const fs = require('fs');

async function fixRota() {
  const file = 'src/components/Rota.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add getShiftsForSlot
  content = content.replace(
    /const getShiftForSlot = \(date: string, siteId: string, type: 'Day' \| 'Night'\) => \{/,
    `const getShiftsForSlot = (date: string, siteId: string, type: 'Day' | 'Night') => {
    return shifts.filter(s => {
      const dateMatch = s.date === date;
      const siteMatch = String(s.siteId) === String(siteId);
      const typeMatch = s.type === type;
      return dateMatch && siteMatch && typeMatch;
    });
  };

  const getShiftForSlot = (date: string, siteId: string, type: 'Day' | 'Night') => {`
  );

  // 2. Add isSwapped styles
  // For Day Shift
  content = content.replace(
    /backgroundColor: shift\.staffStatus === 'accepted' \? '#10b98120' : shift\.staffStatus === 'declined' \? '#ef444420' : `\$\{site\.color\}20`,/g,
    `backgroundColor: shift.isSwapped ? '#8b5cf620' : shift.staffStatus === 'accepted' ? '#10b98120' : shift.staffStatus === 'declined' ? '#ef444420' : \`\${site.color}20\`,`
  );

  content = content.replace(
    /border: shift\.published === false\s*\n\s*\? '2px dashed #fbbf24' \/\/ Draft style\s*\n\s*: shift\.staffStatus === 'accepted' \? '2px solid #10b981' : shift\.staffStatus === 'declined' \? '2px solid #ef4444' : `1px solid \$\{site\.color\}40`,/g,
    `border: shift.published === false
                                    ? '2px dashed #fbbf24' // Draft style
                                    : shift.isSwapped ? '2px solid #8b5cf6' : shift.staffStatus === 'accepted' ? '2px solid #10b981' : shift.staffStatus === 'declined' ? '2px solid #ef4444' : \`1px solid \${site.color}40\`,`
  );

  content = content.replace(
    /border: shift\.staffStatus === 'accepted' \? '2px solid #10b981' : shift\.staffStatus === 'declined' \? '2px solid #ef4444' : `1px solid \$\{site\.color\}40`,/g,
    `border: shift.isSwapped ? '2px solid #8b5cf6' : shift.staffStatus === 'accepted' ? '2px solid #10b981' : shift.staffStatus === 'declined' ? '2px solid #ef4444' : \`1px solid \${site.color}40\`,`
  );

  // Add SWAPPED badge
  content = content.replace(
    /\{shift\.isBank \? '🏦 ' : ''\}\{shift\.staffName\}\s*\{shift\.published === false && \(/g,
    `{shift.isBank ? '🏦 ' : ''}{shift.staffName}
                                    {shift.isSwapped && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#8b5cf630',
                                        border: '1px solid #8b5cf6',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#8b5cf6'
                                      }}
                                      title={\`Originally assigned to: \${shift.originalStaffId || 'Another worker'}\`}
                                      >
                                        🔄 SWAPPED
                                      </span>
                                    )}
                                    {shift.published === false && (`
  );

  // For Night shift badge
  content = content.replace(
    /\{shift\.isBank \? '🏦 ' : ''\}\{shift\.staffName\}\s*\{shift\.isBank && \(\(\) => \{/g,
    `{shift.isBank ? '🏦 ' : ''}{shift.staffName}
                                        {shift.isSwapped && (
                                          <span style={{
                                            marginLeft: '4px',
                                            padding: '1px 4px',
                                            backgroundColor: '#8b5cf630',
                                            border: '1px solid #8b5cf6',
                                            borderRadius: '3px',
                                            fontSize: '9px',
                                            fontWeight: '700',
                                            letterSpacing: '0.3px',
                                            color: '#8b5cf6'
                                          }}
                                          title={\`Originally assigned to: \${shift.originalStaffId || 'Another worker'}\`}
                                          >
                                            🔄 SWAPPED
                                          </span>
                                        )}
                                        {shift.isBank && (() => {`
  );

  // Add the tooltip to the main container
  content = content.replace(
    /opacity: shift\.published === false \? 0\.8 : 1\s*\}\}>/g,
    `opacity: shift.published === false ? 0.8 : 1
                                  }}
                                  title={shift.isSwapped ? \`Swapped shift. Originally assigned to: \${shift.originalStaffId || 'Another worker'}\` : undefined}
                                  >`
  );

  content = content.replace(
    /marginBottom: '6px'\s*\}\}>\s*<div style=\{\{/g,
    `marginBottom: '6px'
                                }}>
                                  <div style={{`
  );

  // 3. Update Day/Night shifts to use dayShifts.map / nightShifts.map
  content = content.replace(
    /const shift = getShiftForSlot\(date, site\.id, 'Day'\);\s*return shift \? \(\s*<div>/g,
    `const dayShifts = getShiftsForSlot(date, site.id, 'Day');
                            return dayShifts.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {dayShifts.map(shift => (`
  );

  content = content.replace(
    /const shift = getShiftForSlot\(date, site\.id, 'Night'\);\s*return shift \? \(\s*<div>/g,
    `const nightShifts = getShiftsForSlot(date, site.id, 'Night');
                            return nightShifts.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {nightShifts.map(shift => (`
  );

  // We need to close the .map
  content = content.replace(
    /Unassigned\s*<\/div>\s*\);\s*\}\)\(\)\}/g,
    `Unassigned
                            </div>
                          );
                        })()}`
  );

  // Because string replace is tricky for closing tags, we'll run a quick script to find them.
  fs.writeFileSync('src/components/Rota.tsx', content, 'utf8');
  console.log('Replacements done. Verifying...');
}

fixRota();
