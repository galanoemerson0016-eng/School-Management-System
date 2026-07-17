/**
 * Front face of a DepEd-style student ID (portrait CR80).
 *
 * Purely presentational — every value comes from IdCardViewModel. Layout-critical
 * dimensions/colors use inline styles (the PDF pipeline clones this DOM to a
 * standalone doc; inline styles + the dynamic primaryColor survive reliably and
 * print exact via the pipeline's print-color-adjust). QR/barcode are <img> data
 * URLs (a live <canvas> would be lost when the pipeline serializes outerHTML).
 */
import type { IdCardViewModel } from '../../services/id-card/idCardData';
import { CARD_WIDTH, CARD_HEIGHT } from './idCardDimensions';

const FALLBACK_LOGO = `${import.meta.env.BASE_URL}school-logo.png`;

// A beautiful, highly professional background watermark rendering the school's logo
function WatermarkSeal({ logoUrl, opacity }: { logoUrl?: string; opacity: number }) {
    return (
        <div style={{
            position: 'absolute',
            top: '25.2mm',
            left: '6.0mm',
            width: '42mm',
            height: '42mm',
            opacity,
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

export function IdCardFront({ model }: { model: IdCardViewModel }) {
    const { primaryColor, accentColor, template } = model;
    
    // Determine photo sizes and frames
    const photoSize = 
        template === 'compact' 
            ? '22mm' 
            : template === 'lanyard' 
            ? '30mm' 
            : template === 'playful'
            ? '25mm'
            : '26mm';

    // Background style selection based on template (custom bg rendered as a separate layer below)
    const cardBg = template === 'modern'
            ? `linear-gradient(180deg, #ffffff 62%, ${primaryColor}10 100%)`
            : template === 'corporate'
            ? '#f8fafc'
            : template === 'academic'
            ? `linear-gradient(180deg, #fefdfa 0%, #f6f3eb 100%)`
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
    const bgSizeMode = model.bgImageSize || 'cover';
    const bgObjectFit: React.CSSProperties['objectFit'] = 
        bgSizeMode === 'cover' ? 'cover' 
        : bgSizeMode === 'contain' ? 'contain' 
        : bgSizeMode === 'stretch' ? 'fill' 
        : 'none'; // 'actual' = original size
    const bgScale = (model.bgImageScale || 100) / 100;
    const bgPosX = model.bgImagePositionX ?? 50;
    const bgPosY = model.bgImagePositionY ?? 50;

    // Adaptive name sizing and letter-spacing to prevent text overflow on long names, keeping it strictly single-line
    const nameLength = (model.fullName || '').length;
    const nameFontSize = 
        nameLength > 32
            ? '1.8mm'
            : nameLength > 28
            ? '2.0mm'
            : nameLength > 24
            ? '2.3mm'
            : nameLength > 20
            ? '2.6mm'
            : nameLength > 15
            ? '2.9mm'
            : '3.2mm';
    const lrnFontSize = 
        nameLength > 32
            ? '1.5mm'
            : nameLength > 28
            ? '1.65mm'
            : nameLength > 24
            ? '1.9mm'
            : nameLength > 20
            ? '2.1mm'
            : nameLength > 15
            ? '2.3mm'
            : '2.6mm';
    const nameLetterSpacing = 
        nameLength > 32
            ? '-0.08mm'
            : nameLength > 28
            ? '-0.05mm'
            : nameLength > 24
            ? '-0.02mm'
            : 'normal';
    const nameFontFamily = template === 'academic' ? "'Georgia', Times, serif" : "'Segoe UI', Arial, sans-serif";

    return (
        <div
            className="id-card id-card-front"
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
            {/* Custom background image layer */}
            {model.bgImageUrl && (
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

            {/* Watermark Seal - applied to templates that benefit from texture */}
            {template !== 'minimalist' && <WatermarkSeal logoUrl={model.logoUrl} opacity={model.watermarkOpacity} />}

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
                    {/* Vertical school name watermark */}
                    <div style={{
                        position: 'absolute',
                        right: '1.8mm',
                        top: '18mm',
                        height: '62mm',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 1,
                        writingMode: 'vertical-rl',
                        textTransform: 'uppercase',
                        fontSize: '1.6mm',
                        fontWeight: 900,
                        color: `${primaryColor}08`,
                        letterSpacing: '0.8mm',
                        fontFamily: nameFontFamily,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                    }}>
                        {model.schoolName || 'CALIBUNGAN HIGH SCHOOL'}
                    </div>
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
                    {/* Bottom-left soft organic leaf-like blob */}
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

            {/* Photo Section */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                paddingLeft: '0',
                paddingTop: model.show.slot 
                    ? '1.2mm' 
                    : (template === 'compact' ? '1.8mm' : '2.4mm'), 
                position: 'relative',
                zIndex: 2 
            }}>
                <div
                    style={{
                        width: photoSize,
                        height: photoSize,
                        border: template === 'playful' ? `0.45mm solid ${primaryColor}` : template === 'glass' ? '0.25mm solid #ffffffb0' : template === 'aurora' ? '0.2mm solid #ffffff80' : `0.3mm solid ${primaryColor}`,
                        outline: template === 'academic' || template === 'glass' ? `0.25mm solid ${accentColor}50` : 'none',
                        outlineOffset: template === 'academic' || template === 'glass' ? '0.5mm' : 'none',
                        borderRadius: template === 'playful' ? '50%' : template === 'eco' ? '3.0mm' : '1.5mm',
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: template === 'minimalist' 
                            ? `1.0mm 1.0mm 0px ${accentColor}`
                            : template === 'glass'
                            ? '0 0.5mm 1.5mm rgba(255, 255, 255, 0.15)'
                            : '0 0.5mm 1.5mm rgba(0, 0, 0, 0.08)',
                    }}
                >
                    {model.photoUrl ? (
                        <img
                            src={model.photoUrl}
                            alt="Student"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <span style={{ fontSize: '1.8mm', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>NO PHOTO</span>
                    )}
                </div>
            </div>

            {/* Identity & Details Section */}
            <div 
                style={{ 
                    flex: 1, 
                    padding: model.show.slot 
                        ? (template === 'compact' ? '1.0mm 2mm 1mm' : (template === 'minimalist' || template === 'badges') ? '1.2mm 2.5mm 1mm' : '1.5mm 2.5mm 1mm') 
                        : (template === 'compact' ? '1.5mm 2mm 1mm' : (template === 'minimalist' || template === 'badges') ? '1.8mm 2.5mm 1mm' : '2.6mm 2.5mm 1mm'), 
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
                {/* Structured label layout for Corporate */}
                {template === 'corporate' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: model.show.slot ? '1.2mm' : '2.0mm', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.15mm', fontWeight: 700, color: `${primaryColor}b0`, textTransform: 'uppercase', letterSpacing: '0.08mm', marginBottom: '0.2mm' }}>STUDENT NAME</span>
                            <div style={{ fontSize: nameFontSize, fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: nameLetterSpacing }}>
                                {model.fullName || 'STUDENT NAME'}
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.15mm', fontWeight: 700, color: `${primaryColor}b0`, textTransform: 'uppercase', letterSpacing: '0.08mm', marginBottom: '0.2mm' }}>LEARNER REFERENCE NUMBER</span>
                            <div style={{ fontSize: lrnFontSize, color: '#334155', fontWeight: 600, letterSpacing: '0.1mm' }}>
                                {model.lrn}
                            </div>
                        </div>
                    </div>
                ) : template === 'academic' ? (
                    // Academic layout (Georgia font names, ornamental lines)
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontFamily: nameFontFamily, fontSize: nameFontSize, fontWeight: 700, lineHeight: 1.1, textTransform: 'uppercase', color: primaryColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        {/* Golden/Accent divider ribbon */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '32mm', margin: model.show.slot ? '0.6mm auto 1.0mm' : '1.0mm auto 1.6mm', gap: '0.8mm' }}>
                            <div style={{ flex: 1, height: '0.15mm', background: accentColor }} />
                            <div style={{ width: '0.8mm', height: '0.8mm', background: accentColor, transform: 'rotate(45deg)' }} />
                            <div style={{ flex: 1, height: '0.15mm', background: accentColor }} />
                        </div>

                        <div style={{ fontSize: lrnFontSize, color: '#475569', fontWeight: 600, letterSpacing: '0.05mm', fontFamily: nameFontFamily }}>
                            LRN: <span style={{ color: '#0f172a', fontWeight: 700 }}>{model.lrn}</span>
                        </div>
                    </div>
                ) : template === 'minimalist' ? (
                    // Minimalist asymmetrical layout
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            fontSize: '1.2mm', 
                            fontWeight: 800, 
                            color: '#ffffff', 
                            background: accentColor, 
                            padding: '0.3mm 1.5mm', 
                            borderRadius: '0.6mm',
                            textTransform: 'uppercase', 
                            letterSpacing: '0.15mm',
                            display: 'inline-block',
                            marginBottom: model.show.slot ? '0.5mm' : '0.8mm'
                        }}>
                            STUDENT
                        </div>
                        <div style={{ fontSize: nameFontSize, fontWeight: 900, lineHeight: 1.15, textTransform: 'uppercase', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        <div style={{ width: '15mm', height: '0.3mm', background: `linear-gradient(90deg, ${primaryColor}20 0%, ${accentColor} 50%, ${primaryColor}20 100%)`, margin: model.show.slot ? '1.5mm 0' : '2.2mm 0' }} />

                        <div style={{ fontSize: lrnFontSize, color: '#64748b', fontWeight: 500 }}>
                            LRN <strong style={{ color: '#0f172a', marginLeft: '0.8mm' }}>{model.lrn}</strong>
                        </div>
                    </div>
                ) : template === 'playful' ? (
                    // Playful layout (Pills, circular accents)
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: nameFontSize, fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        <div style={{ 
                            fontSize: lrnFontSize, 
                            color: '#64748b', 
                            marginTop: model.show.slot ? '0.8mm' : '1.2mm', 
                            fontWeight: 600, 
                            background: '#f1f5f9', 
                            padding: '0.2mm 1.5mm', 
                            borderRadius: '2mm',
                            border: '0.15mm solid #e2e8f0'
                        }}>
                            LRN: {model.lrn}
                        </div>
                    </div>
                ) : template === 'eco' ? (
                    // Eco / Botanical / Natural template
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            fontSize: '1.2mm', 
                            fontWeight: 800, 
                            color: '#ffffff', 
                            background: `${primaryColor}aa`, 
                            padding: '0.3mm 1.8mm', 
                            borderRadius: '2mm',
                            textTransform: 'uppercase', 
                            letterSpacing: '0.12mm',
                            display: 'inline-block',
                            marginBottom: model.show.slot ? '0.6mm' : '1.0mm'
                        }}>
                            STUDENT
                        </div>
                        <div style={{ fontSize: nameFontSize, fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        {/* Leafy double dot divider */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '22mm', margin: model.show.slot ? '1.5mm 0' : '2.2mm 0', gap: '1mm', justifyContent: 'center' }}>
                            <div style={{ width: '1.2mm', height: '1.2mm', borderRadius: '50%', background: `${accentColor}80` }} />
                            <div style={{ width: '1.8mm', height: '1.8mm', borderRadius: '50%', background: accentColor }} />
                            <div style={{ width: '1.2mm', height: '1.2mm', borderRadius: '50%', background: `${accentColor}80` }} />
                        </div>

                        <div style={{ fontSize: lrnFontSize, color: '#475569', fontWeight: 600 }}>
                            LRN: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{model.lrn}</strong>
                        </div>
                    </div>
                ) : template === 'glass' ? (
                    // Frosted Glassmorphism template
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.88)',
                        border: '0.2mm solid rgba(255, 255, 255, 0.65)',
                        borderRadius: '2mm',
                        padding: '1.6mm 2mm 1.2mm',
                        margin: model.show.slot ? '1.2mm 1.5mm 1mm' : '1.8mm 1.5mm 1.2mm',
                        boxShadow: '0 0.8mm 2mm rgba(0, 0, 0, 0.03)',
                        zIndex: 2
                    }}>
                        <div style={{ 
                            fontSize: '1.1mm', 
                            fontWeight: 800, 
                            color: primaryColor, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.15mm',
                            display: 'inline-block',
                            marginBottom: '0.6mm'
                        }}>
                            STUDENT
                        </div>
                        <div style={{ fontSize: nameFontSize, fontWeight: 900, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        <div style={{ width: '12mm', height: '0.3mm', background: 'rgba(0, 0, 0, 0.08)', margin: '1.8mm 0' }} />

                        <div style={{ fontSize: lrnFontSize, color: '#475569', fontWeight: 600 }}>
                            LRN: <span style={{ color: '#0f172a', fontWeight: 800 }}>{model.lrn}</span>
                        </div>
                    </div>
                ) : template === 'badges' ? (
                    // Academy / Badges template
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            fontSize: '1.25mm', 
                            fontWeight: 900, 
                            color: '#ffffff', 
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`, 
                            padding: '0.4mm 2.0mm', 
                            borderRadius: '3mm',
                            textTransform: 'uppercase', 
                            letterSpacing: '0.15mm',
                            display: 'inline-block',
                            marginBottom: model.show.slot ? '0.6mm' : '1.0mm'
                        }}>
                            STUDENT
                        </div>
                        <div style={{ fontSize: nameFontSize, fontWeight: 900, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        <div style={{ width: '22mm', height: '0.6mm', background: primaryColor, margin: model.show.slot ? '1.6mm 0' : '2.4mm 0', borderRadius: '0.3mm' }} />

                        <div style={{ fontSize: lrnFontSize, color: '#475569', fontWeight: 700 }}>
                            LRN: <strong style={{ color: primaryColor }}>{model.lrn}</strong>
                        </div>
                    </div>
                ) : template === 'aurora' ? (
                    // Aurora flowing mesh gradient template
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            fontSize: '1.2mm', 
                            fontWeight: 800, 
                            color: '#ffffff', 
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`, 
                            padding: '0.3mm 2.2mm', 
                            borderRadius: '1.5mm',
                            textTransform: 'uppercase', 
                            letterSpacing: '0.15mm',
                            display: 'inline-block',
                            marginBottom: model.show.slot ? '0.6mm' : '1.0mm',
                            boxShadow: `0 0.4mm 1mm ${primaryColor}20`
                        }}>
                            STUDENT
                        </div>
                        <div style={{ fontSize: nameFontSize, fontWeight: 900, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        
                        <div style={{ width: '20mm', height: '0.4mm', background: `linear-gradient(90deg, ${primaryColor}20 0%, ${accentColor} 50%, ${primaryColor}20 100%)`, margin: model.show.slot ? '1.5mm 0' : '2.2mm 0' }} />

                        <div style={{ fontSize: lrnFontSize, color: '#475569', fontWeight: 700 }}>
                            LRN: <strong style={{ color: '#0f172a' }}>{model.lrn}</strong>
                        </div>
                    </div>
                ) : (
                    // Standard / Lanyard / Compact general styles
                    <>
                        <div style={{ fontSize: nameFontSize, fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase', color: '#0f172a', fontFamily: nameFontFamily, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', letterSpacing: nameLetterSpacing }}>
                            {model.fullName || 'STUDENT NAME'}
                        </div>
                        <div style={{ fontSize: lrnFontSize, color: '#475569', marginTop: model.show.slot ? '0.8mm' : '1.2mm', fontWeight: 600, letterSpacing: '0.1mm' }}>
                            LRN: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{model.lrn}</strong>
                        </div>
                    </>
                )}

                {/* Codes footer: ensures QR stays perfectly placed and aligned */}
                <div style={{ 
                    marginTop: 'auto', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    paddingBottom: model.show.slot 
                        ? (template === 'lanyard' ? '2.5mm' : template === 'modern' ? '2.0mm' : '1.8mm') 
                        : (template === 'lanyard' ? '3.5mm' : template === 'modern' ? '3mm' : '2.5mm') 
                }}>
                    {model.show.qr && model.qrDataUrl && (
                        <img 
                            src={model.qrDataUrl} 
                            alt="QR" 
                            style={{ 
                                width: '21.0mm', 
                                height: '21.0mm',
                                border: template === 'academic' 
                                    ? `0.2mm solid ${accentColor}40` 
                                    : template === 'minimalist'
                                    ? `0.25mm solid ${primaryColor}20`
                                    : template === 'eco'
                                    ? `0.25mm solid ${primaryColor}40`
                                    : template === 'glass'
                                    ? '0.2mm solid rgba(255,255,255,0.7)'
                                    : template === 'aurora'
                                    ? '0.25mm solid #ffffffb0'
                                    : 'none',
                                padding: (template === 'academic' || template === 'minimalist' || template === 'eco' || template === 'glass' || template === 'aurora') ? '0.4mm' : '0',
                                background: (template === 'academic' || template === 'minimalist' || template === 'eco' || template === 'glass' || template === 'aurora') ? '#ffffff' : 'transparent',
                                borderRadius: template === 'playful' || template === 'eco' ? '1.5mm' : '0'
                            }} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
