// Backend accepts punctuation and 7–15 digits and returns stored strings unchanged.
// Only remove a Lebanese trunk zero when the remaining national number is valid.
export function whatsappPhone(value) {
    const cleaned = String(value).trim().replace(/[\s()-]/g, '');
    if (!/^\+?\d+$/.test(cleaned))
        return null;
    const explicit = cleaned.startsWith('+') || cleaned.startsWith('00');
    let digits = cleaned.replace(/^\+|^00/, '');
    const lebanese = (number) => /^(?:[1345689]\d{6}|(?:2[124-9]|7[01689]|8[1-9])\d{6})$/.test(number);
    if (digits.startsWith('961')) {
        let national = digits.slice(3);
        if (national.startsWith('0') && lebanese(national.slice(1)))
            national = national.slice(1);
        return lebanese(national) ? `961${national}` : null;
    }
    if (explicit)
        return /^[1-9]\d{6,14}$/.test(digits) ? digits : null;
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
        return lebanese(digits) ? `961${digits}` : null;
    }
    if (lebanese(digits))
        return `961${digits}`;
    // Bare long international numbers are preserved; ambiguous short values need review.
    return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}
