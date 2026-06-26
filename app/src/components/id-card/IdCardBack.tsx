import type { IdCardViewModel } from '../../services/id-card/idCardData';
import { CARD_WIDTH, CARD_HEIGHT } from './idCardDimensions';

const FALLBACK_LOGO = `${import.meta.env.BASE_URL}school-logo.png`;

// A beautiful, highly professional background watermark rendering the school's logo
function WatermarkSeal({ logoUrl }: { logoUrl?: string }) {
    return (
        <div style={{
            position: 'absolute',
            top: '25.2mm',
            left: '6.0mm',
            width: '42mm',
            height: '42mm',
            opacity: 0.042,
            pointerEvents: 'none',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
        }}>
            <img
                src={logoUrl || FALLBACK_LOGO}
                alt="Watermark"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        </div>
    );
}

export function IdCardBack({ model }: { model: IdCardViewModel }) {
    const { primaryColor, accentColor, template } = model;

    // Background style selection based on template (custom bg rendered as separate layer)
    const cardBg = template === 'modern'
            ? `linear-gradient(180deg, #ffffff 62%, ${primaryColor}10 100%)`
            : template === 'corporate'
            ? '#f8fafc'
            : template === 'academic'
            ? `linear-gradient(180deg, #fdfcf7 0%, #f6f3eb 100%)`
            : template === 'playful'
            ? `linear-gradient(135deg, #ffffff 60%, ${primaryColor}0d 100%)`
            : template === 'eco'
            ? `linear-gradient(180deg, #fbfcf9 0%, #f1f6ed 100%)`
            : template === 'glass'
            ? `linear-gradient(135deg, #ffffff 0%, ${primaryColor}06 50%, ${accentColor}08 100%)`
            : template === 'aurora'
            ? `linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}12 50%, #ffffff 100%)`
            : '#ffffff';

    // Compute background image rendering styles
    const showBgImage = model.bgImageUrl && model.bgImageApplyToBack;
    const bgSizeMode = model.bgImageSize || 'cover';
    const bgObjectFit: React.CSSProperties['objectFit'] = 
        bgSizeMode === 'cover' ? 'cover' 
        : bgSizeMode === 'contain' ? 'contain' 
        : bgSizeMode === 'stretch' ? 'fill' 
        : 'none';
    const bgScale = (model.bgImageScale || 100) / 100;
    const bgPosX = model.bgImagePositionX ?? 50;
    const bgPosY = model.bgImagePositionY ?? 50;

    const cardFontFamily = template === 'academic' ? "'Georgia', Times, serif" : "'Segoe UI', Arial, sans-serif";

    return (
        <div
            className="id-card id-card-back"
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                boxSizing: 'border-box',
                background: cardBg,
                border: `0.3mm solid ${primaryColor}`,
                borderRadius: '2.5mm',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#0f172a',
                position: 'relative',
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
            }}
        >
            {/* Custom background image layer (only if apply-to-back is enabled) */}
            {showBgImage && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    borderRadius: '2.2mm',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}>
                    <img
                        src={model.bgImageUrl}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: bgObjectFit,
                            objectPosition: `${bgPosX}% ${bgPosY}%`,
                            transform: bgScale !== 1 ? `scale(${bgScale})` : undefined,
                            opacity: model.bgImageOpacity ?? 1,
                            filter: `blur(${model.bgImageBlur ?? 0}px) brightness(${(model.bgImageBrightness ?? 100) / 100})`,
                            pointerEvents: 'none',
                        }}
                    />
                </div>
            )}

            {/* Watermark Seal */}
            {template !== 'minimalist' && <WatermarkSeal logoUrl={model.logoUrl} />}

            {/* Lanyard Slot Punch Simulation */}
            {model.show.slot && (
                <div style={{
                    position: 'absolute',
                    top: '1.5mm',
                    left: '23.0mm',
                    width: '8mm',
                    height: '1.6mm',
                    borderRadius: '0.8mm',
                    background: '#00000018',
                    border: '0.15mm solid #00000008',
                    zIndex: 10,
                    pointerEvents: 'none'
                }} />
            )}

            {/* Template-specific background graphics */}
            {template === 'standard' && (
                <div style={{ 
                    position: 'absolute', 
                    inset: '0.8mm', 
                    border: `0.18mm solid ${primaryColor}1e`, 
                    borderRadius: '1.8mm', 
                    pointerEvents: 'none',
                    zIndex: 1
                }} />
            )}

            {template === 'academic' && (
                <>
                    {/* Double golden border frame representing academic honor */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: '0.8mm', 
                        border: `0.3mm solid ${primaryColor}60`, 
                        borderRadius: '1.8mm', 
                        pointerEvents: 'none',
                        zIndex: 1
                    }} />
                    <div style={{ 
                        position: 'absolute', 
                        inset: '1.3mm', 
                        border: `0.15mm solid ${accentColor}50`, 
                        borderRadius: '1.3mm', 
                        pointerEvents: 'none',
                        zIndex: 1
                    }} />
                </>
            )}

            {template === 'modern' && (
                <>
                    {/* Left vertical bar */}
                    <div style={{ position: 'absolute', left: '-0.5mm', top: model.show.slot ? '13.5mm' : '11.0mm', bottom: '-0.5mm', width: '2.5mm', background: primaryColor }} />
                    {/* Right vertical bar */}
                    <div style={{ position: 'absolute', right: '-0.5mm', top: model.show.slot ? '13.5mm' : '11.0mm', bottom: '-0.5mm', width: '2.5mm', background: primaryColor }} />
                    {/* Subtle dot grid pattern */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '2.0mm', 
                        right: '2.0mm', 
                        top: model.show.slot ? '15.0mm' : '12.5mm', 
                        bottom: '2mm', 
                        backgroundImage: 'radial-gradient(#00000005 0.25mm, transparent 0.25mm)', 
                        backgroundSize: '3mm 3mm',
                        pointerEvents: 'none'
                    }} />
                    {/* Tech crosshairs in corner */}
                    <div style={{ position: 'absolute', left: '2.8mm', top: model.show.slot ? '16.5mm' : '14mm', width: '1.5mm', height: '1.5mm', borderLeft: '0.15mm solid #00000020', borderTop: '0.15mm solid #00000020', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', right: '2.8mm', top: model.show.slot ? '16.5mm' : '14mm', width: '1.5mm', height: '1.5mm', borderRight: '0.15mm solid #00000020', borderTop: '0.15mm solid #00000020', pointerEvents: 'none' }} />
                    {/* Solid bottom accent bar */}
                    <div style={{ position: 'absolute', bottom: '-0.5mm', left: '-0.5mm', right: '-0.5mm', height: '3.0mm', background: primaryColor }} />
                </>
            )}

            {template === 'corporate' && (
                <>
                    {/* Top right diagonal slice */}
                    <div style={{ 
                        position: 'absolute', 
                        right: '-10mm', 
                        top: '5mm', 
                        width: '30mm', 
                        height: '25mm', 
                        background: `${primaryColor}08`, 
                        transform: 'rotate(-35deg)', 
                        pointerEvents: 'none' 
                    }} />
                    {/* Bottom left diagonal slice */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '-15mm', 
                        bottom: '-10mm', 
                        width: '35mm', 
                        height: '25mm', 
                        background: `${accentColor}0a`, 
                        transform: 'rotate(25deg)', 
                        pointerEvents: 'none' 
                    }} />
                    {/* Inner premium border frame */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: '0.8mm', 
                        border: `0.15mm solid ${primaryColor}1a`, 
                        borderRadius: '1.8mm', 
                        pointerEvents: 'none' 
                    }} />
                </>
            )}

            {template === 'lanyard' && (
                <>
                    {/* Colored line separators under header */}
                    <div style={{ position: 'absolute', left: 0, right: 0, top: model.show.slot ? '15.0mm' : '12.5mm', height: '0.6mm', background: primaryColor }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: model.show.slot ? '15.6mm' : '13.1mm', height: '0.3mm', background: accentColor }} />
                    {/* Subtle vertical striping */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: model.show.slot ? '15.9mm 0 2.5mm' : '13.4mm 0 2.5mm', 
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3mm, ${primaryColor}02 3mm, ${primaryColor}02 3.3mm)`,
                        pointerEvents: 'none' 
                    }} />
                    {/* Solid bottom footer bar */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2.5mm', background: primaryColor }} />
                </>
            )}

            {template === 'minimalist' && (
                <>
                    {/* Bold left-edge primary stripe */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3.8mm',
                        background: primaryColor,
                        zIndex: 10
                    }} />
                    {/* Thin vertical accent line */}
                    <div style={{
                        position: 'absolute',
                        left: '3.8mm',
                        top: 0,
                        bottom: 0,
                        width: '0.3mm',
                        background: accentColor,
                        zIndex: 10
                    }} />
                </>
            )}

            {template === 'playful' && (
                <>
                    {/* Playful background curved shapes */}
                    <div style={{
                        position: 'absolute',
                        left: '-5mm',
                        right: '-5mm',
                        top: model.show.slot ? '15.0mm' : '12.5mm',
                        height: '22mm',
                        background: `radial-gradient(circle at 10% 20%, ${accentColor}10 0%, transparent 55%), radial-gradient(circle at 90% 80%, ${primaryColor}12 0%, transparent 60%)`,
                        pointerEvents: 'none',
                        zIndex: 1
                    }} />
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '-15mm', 
                        right: '-15mm', 
                        width: '35mm', 
                        height: '35mm', 
                        borderRadius: '50%', 
                        background: `${primaryColor}06`,
                        zIndex: 1
                    }} />
                </>
            )}

            {template === 'eco' && (
                <>
                    {/* Natural border */}
                    <div style={{ position: 'absolute', inset: '0.8mm', border: `0.2mm solid ${primaryColor}30`, borderRadius: '3mm', pointerEvents: 'none' }} />
                    {/* Top-right soft organic blob */}
                    <div style={{ 
                        position: 'absolute', 
                        right: '-8mm', 
                        top: '5mm', 
                        width: '28mm', 
                        height: '28mm', 
                        borderRadius: '40% 60% 40% 60%', 
                        background: `${primaryColor}06`,
                        transform: 'rotate(25deg)',
                        pointerEvents: 'none' 
                    }} />
                    {/* Bottom-left soft organic blob */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '-10mm', 
                        bottom: '-5mm', 
                        width: '32mm', 
                        height: '32mm', 
                        borderRadius: '60% 40% 60% 40%', 
                        background: `${accentColor}06`,
                        transform: 'rotate(-15deg)',
                        pointerEvents: 'none' 
                    }} />
                </>
            )}

            {template === 'glass' && (
                <>
                    {/* Vibrant glowing gradient backdrop blobs */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '5mm', 
                        top: '22mm', 
                        width: '26mm', 
                        height: '26mm', 
                        borderRadius: '50%', 
                        background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)`,
                        filter: 'blur(3px)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    <div style={{ 
                        position: 'absolute', 
                        right: '4mm', 
                        bottom: '12mm', 
                        width: '30mm', 
                        height: '30mm', 
                        borderRadius: '50%', 
                        background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                        filter: 'blur(4px)',
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    {/* Sleek thin border overlay */}
                    <div style={{ position: 'absolute', inset: '0.8mm', border: '0.18mm solid #ffffffb0', borderRadius: '1.8mm', pointerEvents: 'none', zIndex: 3 }} />
                </>
            )}

            {template === 'badges' && (
                <>
                    {/* Bold shield badge graphic stripes */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '-20mm', 
                        top: model.show.slot ? '14.0mm' : '11.5mm', 
                        width: '45mm', 
                        height: '45mm', 
                        borderRadius: '50%',
                        background: `${primaryColor}06`,
                        border: `2mm solid ${primaryColor}02`,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    <div style={{ 
                        position: 'absolute', 
                        right: '-20mm', 
                        bottom: '5mm', 
                        width: '45mm', 
                        height: '45mm', 
                        borderRadius: '50%',
                        background: `${accentColor}04`,
                        border: `2mm solid ${accentColor}01`,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    {/* Thick left ribbon */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.2mm', background: primaryColor }} />
                    <div style={{ position: 'absolute', left: '2.2mm', top: 0, bottom: 0, width: '1.2mm', background: accentColor }} />
                </>
            )}

            {template === 'aurora' && (
                <>
                    {/* Fluid colorful aurora design stripes */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '-15mm', 
                        top: '12.5mm', 
                        width: '45mm', 
                        height: '45mm', 
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${primaryColor}1a 0%, transparent 80%)`,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                    <div style={{ 
                        position: 'absolute', 
                        right: '-15mm', 
                        bottom: '-5mm', 
                        width: '50mm', 
                        height: '50mm', 
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 80%)`,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }} />
                </>
            )}

            {/* Header band: logo + school identity */}
            <div
                style={{
                    background: primaryColor,
                    color: model.headerTextColor || '#ffffff',
                    fontFamily: model.headerFontFamily || 'inherit',
                    padding: model.show.slot 
                        ? (template === 'minimalist' || template === 'badges' ? '3.8mm 2mm 1.0mm 5.8mm' : '3.8mm 2mm 1.0mm')
                        : (template === 'minimalist' || template === 'badges' ? '1.2mm 2mm 1.2mm 5.8mm' : '1.2mm 2mm'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.6mm',
                    height: model.show.slot ? '15.0mm' : '12.5mm',
                    boxSizing: 'border-box',
                    position: 'relative',
                    zIndex: 2,
                    // Modern template adjustments to align flush with borders
                    margin: template === 'modern' ? '-0.5mm -0.5mm 0 -0.5mm' : '0',
                    borderRadius: template === 'modern' ? '2.1mm 2.1mm 0 0' : '0',
                    printColorAdjust: 'exact',
                    WebkitPrintColorAdjust: 'exact',
                }}
            >
                <img
                    src={model.logoUrl || FALLBACK_LOGO}
                    alt="Logo"
                    style={{ width: '9.5mm', height: '9.5mm', objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
                    <div style={{ fontSize: `${1.43 * model.headerFontSizeScale}mm`, fontWeight: 600, opacity: 0.95 }}>
                        {model.deptName}
                    </div>
                    <div style={{ fontSize: `${1.3 * model.headerFontSizeScale}mm`, opacity: 0.9 }}>
                        {model.region}
                    </div>
                    <div style={{ fontSize: `${1.3 * model.headerFontSizeScale}mm`, opacity: 0.9, whiteSpace: 'nowrap' }}>
                        {model.division}
                    </div>
                    <div style={{ fontSize: `${1.3 * model.headerFontSizeScale}mm`, opacity: 0.9 }}>
                        {model.district}
                    </div>
                    <div style={{ fontSize: `${2.0 * model.headerFontSizeScale}mm`, fontWeight: 800, textTransform: 'uppercase', marginTop: '0.2mm', whiteSpace: 'nowrap' }}>
                        {model.schoolName || 'CALIBUNGAN HIGH SCHOOL'}
                    </div>
                    <div style={{ fontSize: `${1.3 * model.headerFontSizeScale}mm`, opacity: 0.9, textTransform: 'uppercase' }}>
                        {model.schoolAddress || 'VICTORIA, TARLAC'}
                    </div>
                </div>
            </div>

            {/* Main content body */}
            <div 
                style={{ 
                    flex: 1, 
                    padding: template === 'compact' 
                        ? (model.show.slot ? '1.0mm 2mm 1mm' : '1.5mm 2mm 1mm') 
                        : (template === 'minimalist' || template === 'badges') 
                        ? (model.show.slot ? '1.2mm 3mm 1mm 6.5mm' : '1.8mm 3mm 1mm 6.5mm') 
                        : (template === 'modern' || template === 'lanyard') 
                        ? (model.show.slot ? '1.2mm 3mm 3.6mm' : '1.8mm 3mm 4.6mm') 
                        : (model.show.slot ? '1.2mm 3mm 1mm' : '1.8mm 3mm 1mm'),
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column',
                    margin: template === 'compact' ? '1.2mm 2.5mm 1.5mm' : '0',
                    background: template === 'compact' ? `${primaryColor}06` : 'transparent',
                    border: template === 'compact' ? `0.2mm solid ${primaryColor}15` : 'none',
                    borderRadius: template === 'compact' ? '1.8mm' : '0',
                    position: 'relative',
                    zIndex: 2
                }}
            >
                {/* Validity */}
                <div style={{ 
                    fontSize: '2.1mm', 
                    fontWeight: 700, 
                    color: '#334155', 
                    letterSpacing: '0.08mm', 
                    marginBottom: model.show.slot ? '0.6mm' : '1.0mm',
                    fontFamily: cardFontFamily 
                }}>
                    VALIDITY: {model.validityText}
                </div>

                {/* Emergency block */}
                <div style={{ marginTop: model.show.slot ? '1.0mm' : '1.5mm' }}>
                    <div style={{ 
                        fontSize: '1.85mm', 
                        fontWeight: 800, 
                        color: accentColor, 
                        letterSpacing: '0.05mm', 
                        textTransform: 'uppercase', 
                        marginBottom: '1.0mm',
                        fontFamily: cardFontFamily 
                    }}>
                        {model.emergencyText}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: model.show.slot ? '0.8mm' : '1.2mm' }}>
                        {/* Name */}
                        <div>
                            <div style={{ 
                                fontSize: '2.1mm', 
                                fontWeight: 700, 
                                borderBottom: '0.15mm solid #cbd5e1', 
                                display: 'inline-block', 
                                minWidth: '42mm', 
                                paddingBottom: '0.3mm', 
                                color: '#0f172a',
                                fontFamily: cardFontFamily
                            }}>
                                {model.emergencyName}
                            </div>
                            <div style={{ fontSize: '2.1mm', color: '#64748b', marginTop: '0.1mm', textTransform: 'uppercase', fontWeight: 600, fontFamily: cardFontFamily }}>Name</div>
                        </div>

                        {/* Address */}
                        <div>
                            <div style={{ 
                                fontSize: '2.1mm', 
                                fontWeight: 700, 
                                borderBottom: '0.15mm solid #cbd5e1', 
                                display: 'inline-block', 
                                minWidth: '42mm', 
                                paddingBottom: '0.3mm', 
                                color: '#0f172a', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                maxWidth: '44mm',
                                fontFamily: cardFontFamily
                            }}>
                                {model.emergencyAddress}
                            </div>
                            <div style={{ fontSize: '2.1mm', color: '#64748b', marginTop: '0.1mm', textTransform: 'uppercase', fontWeight: 600, fontFamily: cardFontFamily }}>Address</div>
                        </div>

                        {/* Contact */}
                        <div>
                            <div style={{ 
                                fontSize: '2.1mm', 
                                fontWeight: 700, 
                                borderBottom: '0.15mm solid #cbd5e1', 
                                display: 'inline-block', 
                                minWidth: '42mm', 
                                paddingBottom: '0.3mm', 
                                color: '#0f172a',
                                fontFamily: cardFontFamily
                            }}>
                                {model.emergencyContact}
                            </div>
                            <div style={{ fontSize: '2.1mm', color: '#64748b', marginTop: '0.1mm', textTransform: 'uppercase', fontWeight: 600, fontFamily: cardFontFamily }}>Contact Number</div>
                        </div>
                    </div>
                </div>

                {/* Certify text */}
                <div style={{ 
                    marginTop: model.show.slot ? '1.2mm' : '2.0mm', 
                    fontSize: '1.75mm', 
                    lineHeight: 1.3, 
                    color: '#475569', 
                    padding: '0 2mm', 
                    fontFamily: cardFontFamily 
                }}>
                    This certifies that the bearer whose picture appears on this card is a student of <strong style={{ color: primaryColor }}>{model.schoolName}</strong>
                </div>

                {/* Signature and non-transferable footer */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {model.show.signature && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: model.signatureUrl ? '13mm' : '8mm', justifyContent: 'flex-end' }}>
                            {model.signatureUrl && (
                                <img
                                    src={model.signatureUrl}
                                    alt="Signature"
                                    style={{ height: '8.5mm', maxWidth: '30mm', objectFit: 'contain', marginBottom: '-1.5mm', zIndex: 10 }}
                                />
                            )}
                            <div style={{ borderTop: `0.2mm solid ${primaryColor}70`, width: '42mm' }} />
                            <div style={{ fontSize: '2.1mm', fontWeight: 700, marginTop: '0.3mm', textTransform: 'uppercase', color: '#0f172a', fontFamily: cardFontFamily }}>
                                {model.signatoryName || 'AGAPITO S. GONZAGA'}
                            </div>
                            <div style={{ fontSize: '1.5mm', color: '#475569', fontWeight: 500 }}>
                                {model.signatoryPosition || 'School Head'}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ 
                        fontSize: '2.6mm', 
                        fontWeight: 900, 
                        color: accentColor, 
                        marginTop: '2.0mm', 
                        letterSpacing: '0.5mm',
                        whiteSpace: 'nowrap',
                        fontFamily: cardFontFamily 
                    }}>
                        NON-TRANSFERABLE
                    </div>
                </div>
            </div>
        </div>
    );
}
