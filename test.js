/**
 * Tests für den Verzugszinsrechner
 * Ausführen mit: node test.js
 */

const {
    calculateDefaultInterest,
    calculateCompoundInterest,
    formatCHF,
    formatNumber,
    parseSwissNumber
} = require('./scripts/calculations.js');

let passed = 0;
let failed = 0;

function test(name, condition) {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}`);
        failed++;
    }
}

function approxEqual(a, b, tolerance = 0.01) {
    return Math.abs(a - b) < tolerance;
}

console.log('=== VERZUGSZINSRECHNER TESTS ===\n');

// --- Basic Interest Calculation ---
console.log('--- Grundlegende Zinsberechnung ---');

// Test 1: Simple 1-year calculation at 5%
// CHF 10'000 for a full leap-year period at 5% = CHF 500.00 with actual/actual
{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 0, 1),  // 1.1.2024
        new Date(2025, 0, 1),  // 1.1.2025 (366 days)
        5
    );
    test('1 Jahr (Schaltjahr) bei 5%: CHF 10\'000 → CHF 500.00 Zins',
        approxEqual(result.interest, 500, 0.01));
}

// Test 2: 30 days calculation
// CHF 10'000 for 30 days at 5% in leap year = 10000 * 0.05 * 30/366 = CHF 40.98
{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 0, 1),
        new Date(2024, 0, 31),
        5
    );
    test('30 Tage bei 5%: CHF 10\'000 → CHF 40.98 Zins',
        approxEqual(result.interest, 40.98, 0.01));
}

// Test 3: 91 days calculation
// CHF 5'000 for 91 days at 5% in leap year = 5000 * 0.05 * 91/366 = CHF 62.16
{
    const result = calculateDefaultInterest(
        5000,
        new Date(2024, 0, 1),
        new Date(2024, 3, 1),
        5
    );
    test('91 Tage bei 5%: CHF 5\'000 → CHF 62.16 Zins',
        approxEqual(result.interest, 62.16, 0.01));
}

// --- Different Interest Rates ---
console.log('\n--- Verschiedene Zinssätze ---');

// Test 4: 8% interest rate
{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 0, 1),
        new Date(2024, 0, 31),
        8
    );
    // 10000 * 0.08 * 30/366 = 65.57
    test('30 Tage bei 8%: CHF 10\'000 → CHF 65.57 Zins',
        approxEqual(result.interest, 65.57, 0.01));
}

// Test 5: 3.5% interest rate (1.1. to 1.7. = 182 days in leap year)
{
    const result = calculateDefaultInterest(
        20000,
        new Date(2024, 0, 1),
        new Date(2024, 6, 1),  // 182 days
        3.5
    );
    // 20000 * 0.035 * 182/366 = 348.09
    test('182 Tage bei 3.5%: CHF 20\'000 → ~CHF 348 Zins',
        approxEqual(result.interest, 348.09, 0.01));
}

// --- Edge Cases ---
console.log('\n--- Grenzfälle ---');

// Test 6: Very small amount
{
    const result = calculateDefaultInterest(
        100,
        new Date(2024, 0, 1),
        new Date(2024, 0, 31),
        5
    );
    // 100 * 0.05 * 30/366 = 0.41
    test('Kleiner Betrag: CHF 100 für 30 Tage → CHF 0.41 Zins',
        approxEqual(result.interest, 0.41, 0.01));
}

// Test 7: Large amount
{
    const result = calculateDefaultInterest(
        1000000,
        new Date(2024, 0, 1),
        new Date(2024, 0, 31),
        5
    );
    // 1000000 * 0.05 * 30/366 = 4098.36
    test('Grosser Betrag: CHF 1\'000\'000 für 30 Tage → CHF 4\'098.36 Zins',
        approxEqual(result.interest, 4098.36, 0.01));
}

// Test 8: Single day
{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 0, 1),
        new Date(2024, 0, 2),
        5
    );
    // 10000 * 0.05 * 1/366 = 1.37
    test('1 Tag: CHF 10\'000 → CHF 1.37 Zins',
        approxEqual(result.interest, 1.37, 0.01));
}

// --- Error Handling ---
console.log('\n--- Fehlerbehandlung ---');

// Test 9: Negative principal
{
    const result = calculateDefaultInterest(
        -1000,
        new Date(2024, 0, 1),
        new Date(2024, 0, 31),
        5
    );
    test('Negativer Betrag → Fehler', result.error !== undefined);
}

// Test 10: End date before start date
{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 6, 1),
        new Date(2024, 0, 1),
        5
    );
    test('Enddatum vor Startdatum → Fehler', result.error !== undefined);
}

// --- Formatting Functions ---
console.log('\n--- Formatierungsfunktionen ---');

// Test 11: formatCHF
{
    const formatted = formatCHF(1234.56);
    test('formatCHF(1234.56) enthält "1" und "234"',
        formatted.includes('1') && formatted.includes('234'));
}

// Test 12: parseSwissNumber
{
    const parsed = parseSwissNumber("10'000.50");
    test('parseSwissNumber("10\'000.50") = 10000.5',
        parsed === 10000.5);
}

// Test 13: parseSwissNumber with comma
{
    const parsed = parseSwissNumber("1'234,56");
    test('parseSwissNumber("1\'234,56") = 1234.56',
        approxEqual(parsed, 1234.56, 0.001));
}

// --- Real-world Scenarios ---
console.log('\n--- Praxisbeispiele ---');

// Test 14: Typical invoice scenario
// Invoice of CHF 15'000, overdue by 45 days
{
    const result = calculateDefaultInterest(
        15000,
        new Date(2024, 2, 1),  // 1.3.2024
        new Date(2024, 3, 15), // 15.4.2024 (45 days)
        5
    );
    // 15000 * 0.05 * 45/366 = 92.21
    test('Rechnung CHF 15\'000, ~45 Tage überfällig → ~CHF 92 Zins',
        approxEqual(result.interest, 92.21, 0.01));
}

// Test 15: Long overdue payment
// CHF 50'000 overdue for 2 years
{
    const result = calculateDefaultInterest(
        50000,
        new Date(2022, 0, 1),
        new Date(2024, 0, 1),
        5
    );
    // Two full non-leap years with actual/actual = 50000 * 0.05 * 2
    test('CHF 50\'000, 2 Jahre überfällig → CHF 5\'000 Zins',
        approxEqual(result.interest, 5000, 0.01));
}

// --- Result Object ---
console.log('\n--- Ergebnisobjekt ---');

{
    const result = calculateDefaultInterest(
        10000,
        new Date(2024, 0, 1),
        new Date(2024, 1, 1),
        5
    );
    test('Ergebnis enthält principal', result.principal === 10000);
    test('Ergebnis enthält days', result.days === 31);
    test('Ergebnis enthält interestRate', result.interestRate === 5);
    test('Ergebnis enthält total', result.total === result.principal + result.interest);
}

// --- Summary ---
console.log('\n=== ERGEBNIS ===');
console.log(`${passed} bestanden, ${failed} fehlgeschlagen`);

if (failed === 0) {
    console.log('✅ Alle Tests bestanden!');
    process.exit(0);
} else {
    console.log('❌ Einige Tests fehlgeschlagen');
    process.exit(1);
}
