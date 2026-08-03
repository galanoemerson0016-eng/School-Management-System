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

    // Dynamic scale calculations for back face to prevent text overflow or truncation (...)
    const emergencyNameStr = model.emergencyName || '';
    const emNameLen = emergencyNameStr.length;
    const emNameFontSize = 
        emNameLen > 40 ? '1.3mm' :
        emNameLen > 34 ? '1.5mm' :
        emNameLen > 28 ? '1.7mm' :
        emNameLen > 22 ? '1.95mm' :
        '2.3mm';

    const emergencyContactStr = model.emergencyContact || '';
    const emContactLen = emergencyContactStr.length;
    const emContactFontSize = 
        emContactLen > 26 ? '1.5mm' :
        emContactLen > 20 ? '1.8mm' :
        '2.3mm';

    const emergencyAddressStr = model.emergencyAddress || '';
    const emAddrLen = emergencyAddressStr.length;
    const emAddrFontSize = 
        emAddrLen > 48 ? '1.2mm' :
        emAddrLen > 38 ? '1.4mm' :
        emAddrLen > 30 ? '1.6mm' :
        emAddrLen > 22 ? '1.85mm' :
        '2.2mm';

    const gradeSecStr = model.gradeLevel && model.section 
        ? `${model.gradeLevel.replace(/^Grade\s*/i, '')} - ${model.section}` 
        : (model.gradeLevel?.replace(/^Grade\s*/i, '') || model.section || '');
    const gradeSecLen = gradeSecStr.length;
    const gradeSecFontSize = 
        gradeSecLen > 32 ? '1.1mm' :
        gradeSecLen > 24 ? '1.25mm' :
        gradeSecLen > 16 ? '1.45mm' :
        '1.65mm';

    const sigNameStr = model.signatoryName || 'AGAPITO S. GONZAGA';
    const sigNameLen = sigNameStr.length;
    const sigNameFontSize = 
        sigNameLen > 38 ? '1.6mm' :
        sigNameLen > 30 ? '1.85mm' :
        sigNameLen > 22 ? '2.15mm' :
        '2.6mm';

    const sigPosStr = model.signatoryPosition || 'OIC-School Head HT VI';
    const sigPosLen = sigPosStr.length;
    const sigPosFontSize = 
        sigPosLen > 36 ? '1.2mm' :
        sigPosLen > 26 ? '1.45mm' :
        '1.8mm';

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
                    <div style={{ position: 'absolute', left: '-0.5mm', top: '6.5mm', bottom: '-0.5mm', width: '2.5mm', background: primaryColor }} />
                    {/* Right vertical bar */}
                    <div style={{ position: 'absolute', right: '-0.5mm', top: '6.5mm', bottom: '-0.5mm', width: '2.5mm', background: primaryColor }} />
                    {/* Subtle dot grid pattern */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '2.0mm', 
                        right: '2.0mm', 
                        top: '8.0mm', 
                        bottom: '2mm', 
                        backgroundImage: 'radial-gradient(#00000005 0.25mm, transparent 0.25mm)', 
                        backgroundSize: '3mm 3mm',
                        pointerEvents: 'none'
                    }} />
                    {/* Tech crosshairs in corner */}
                    <div style={{ position: 'absolute', left: '2.8mm', top: '9.0mm', width: '1.5mm', height: '1.5mm', borderLeft: '0.15mm solid #00000020', borderTop: '0.15mm solid #00000020', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', right: '2.8mm', top: '9.0mm', width: '1.5mm', height: '1.5mm', borderRight: '0.15mm solid #00000020', borderTop: '0.15mm solid #00000020', pointerEvents: 'none' }} />
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
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '7.0mm', height: '0.6mm', background: primaryColor }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '7.6mm', height: '0.3mm', background: accentColor }} />
                    {/* Subtle vertical striping */}
                    <div style={{ 
                        position: 'absolute', 
                        inset: '7.9mm 0 2.0mm', 
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 3mm, ${primaryColor}02 3mm, ${primaryColor}02 3.3mm)`,
                        pointerEvents: 'none' 
                    }} />
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
                        top: '7.0mm',
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
                        top: '7.0mm', 
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
                        top: '7.0mm', 
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

            {/* IMPORTANT Header Band */}
            <div
                style={{
                    background: primaryColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '7.0mm',
                    boxSizing: 'border-box',
                    position: 'relative',
                    zIndex: 2,
                    margin: template === 'modern' ? '-0.5mm -0.5mm 0 -0.5mm' : '0',
                    borderRadius: template === 'modern' ? '2.1mm 2.1mm 0 0' : '0',
                    printColorAdjust: 'exact',
                    WebkitPrintColorAdjust: 'exact',
                }}
            >
                <div style={{ fontSize: '3.0mm', fontWeight: 800, letterSpacing: '0.6mm', textTransform: 'uppercase' }}>
                    IMPORTANT
                </div>
            </div>

            {/* Main content body */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    padding: template === 'minimalist' || template === 'badges' ? '1.0mm 3mm 0mm 6.5mm' : '1.0mm 3mm 0mm',
                    zIndex: 2,
                }}
            >
                {/* Non-transferable description */}
                <div style={{
                    fontSize: '1.8mm',
                    fontStyle: 'italic',
                    fontFamily: cardFontFamily,
                    color: primaryColor,
                    padding: '0 2.5mm',
                    marginTop: '0.6mm',
                    lineHeight: 1.2,
                    textAlign: 'center',
                    zIndex: 2,
                }}>
                    This card is non-transferable and must be worn within the school premises at all times.
                </div>

                {/* Validation Table */}
                <table
                    style={{
                        width: '46.5mm',
                        margin: '1.0mm auto 1.5mm',
                        borderCollapse: 'collapse',
                        border: `0.18mm solid ${primaryColor}`,
                        zIndex: 2,
                        fontFamily: cardFontFamily,
                    }}
                >
                    <thead>
                        <tr style={{ background: `${accentColor}20`, borderBottom: `0.18mm solid ${primaryColor}` }}>
                            <th style={{ width: '15.5mm', fontSize: '1.4mm', fontWeight: 800, color: primaryColor, padding: '0.4mm 0.3mm', borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center' }}>SCHOOL YEAR</th>
                            <th style={{ width: '17.0mm', fontSize: '1.4mm', fontWeight: 800, color: primaryColor, padding: '0.4mm 0.3mm', borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center' }}>GRADE & SECTION</th>
                            <th style={{ width: '14.0mm', fontSize: '1.4mm', fontWeight: 800, color: primaryColor, padding: '0.4mm 0.3mm', textAlign: 'center' }}>ADVISER</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '1.75mm', fontWeight: 700, color: '#000000' }}>
                        {/* Row 1: Active School Year */}
                        <tr style={{ borderBottom: `0.18mm solid ${primaryColor}`, height: '4.8mm' }}>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{model.schoolYear || '2026-2027'}</td>
                            <td style={{ 
                                borderRight: `0.18mm solid ${primaryColor}`, 
                                textAlign: 'center', 
                                verticalAlign: 'middle', 
                                textTransform: 'uppercase', 
                                fontSize: gradeSecFontSize, 
                                fontWeight: 800,
                                wordBreak: 'break-word',
                                lineHeight: 1.1,
                                padding: '0 0.5mm',
                            }}>
                                {gradeSecStr}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '0.1mm' }}>
                                {model.adviserSignatureUrl && (
                                    <img
                                        src={model.adviserSignatureUrl}
                                        alt=""
                                        style={{ height: '4.2mm', maxWidth: '13.5mm', objectFit: 'contain' }}
                                    />
                                )}
                            </td>
                        </tr>
                        {/* Row 2: 2027-2028 */}
                        <tr style={{ borderBottom: `0.18mm solid ${primaryColor}`, height: '4.8mm' }}>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center', verticalAlign: 'middle' }}>2027-2028</td>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}` }}></td>
                            <td></td>
                        </tr>
                        {/* Row 3: 2028-2029 */}
                        <tr style={{ borderBottom: `0.18mm solid ${primaryColor}`, height: '4.8mm' }}>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center', verticalAlign: 'middle' }}>2028-2029</td>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}` }}></td>
                            <td></td>
                        </tr>
                        {/* Row 4: 2029-2030 */}
                        <tr style={{ height: '4.8mm' }}>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}`, textAlign: 'center', verticalAlign: 'middle' }}>2029-2030</td>
                            <td style={{ borderRight: `0.18mm solid ${primaryColor}` }}></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>

                {/* Emergency Info block */}
                <div style={{ textAlign: 'center', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.4mm' }}>
                    <div style={{ fontSize: '2.4mm', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.04mm' }}>
                        IN CASE OF EMERGENCY
                    </div>
                    <div style={{ fontSize: '1.95mm', fontStyle: 'italic', color: primaryColor, marginTop: '-0.3mm' }}>
                        Please notify:
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6mm', marginTop: '0.2mm' }}>
                        <div>
                            <div style={{
                                fontSize: emNameFontSize,
                                fontWeight: 800,
                                color: '#000000',
                                borderBottom: `0.15mm solid ${primaryColor}`,
                                display: 'inline-block',
                                width: '42mm',
                                paddingBottom: '0.05mm',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                fontFamily: cardFontFamily,
                                wordBreak: 'break-word',
                                lineHeight: 1.1,
                            }}>
                                {emergencyNameStr}
                            </div>
                            <div style={{ fontSize: '1.5mm', fontStyle: 'italic', color: primaryColor, marginTop: '0.05mm' }}>Guardian</div>
                        </div>

                        <div>
                            <div style={{
                                fontSize: emContactFontSize,
                                fontWeight: 800,
                                color: '#000000',
                                borderBottom: `0.15mm solid ${primaryColor}`,
                                display: 'inline-block',
                                width: '42mm',
                                paddingBottom: '0.05mm',
                                textAlign: 'center',
                                fontFamily: cardFontFamily,
                                wordBreak: 'break-word',
                                lineHeight: 1.1,
                            }}>
                                {emergencyContactStr}
                            </div>
                            <div style={{ fontSize: '1.5mm', fontStyle: 'italic', color: primaryColor, marginTop: '0.05mm' }}>Contact</div>
                        </div>

                        <div>
                            <div style={{
                                fontSize: emAddrFontSize,
                                fontWeight: 800,
                                color: '#000000',
                                borderBottom: `0.15mm solid ${primaryColor}`,
                                display: 'inline-block',
                                width: '42mm',
                                paddingBottom: '0.05mm',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                fontFamily: cardFontFamily,
                                wordBreak: 'break-word',
                                lineHeight: 1.1,
                            }}>
                                {emergencyAddressStr}
                            </div>
                            <div style={{ fontSize: '1.5mm', fontStyle: 'italic', color: primaryColor, marginTop: '0.05mm' }}>Address</div>
                        </div>
                    </div>
                </div>

                {/* School Head Signatory & Signature overlapping */}
                <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    width: '100%',
                    zIndex: 2,
                }}>
                    {model.show.signature && model.signatureUrl && (
                        <img
                            src={model.signatureUrl}
                            alt="Signature"
                            style={{
                                position: 'absolute',
                                bottom: '2.5mm',
                                height: '8.0mm',
                                maxWidth: '30mm',
                                objectFit: 'contain',
                                transform: `scale(${model.signatureScale ?? 1.0}) translateY(${model.signatureOffsetY ?? 0}mm)`,
                                transformOrigin: 'bottom center',
                                zIndex: 11,
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                    
                    {/* Signatory Name Block */}
                    <div style={{
                        width: '100%',
                        padding: '0.4mm 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{ fontSize: sigNameFontSize, fontWeight: 900, textTransform: 'uppercase', color: primaryColor, letterSpacing: '0.04mm', textAlign: 'center', wordBreak: 'break-word' }}>
                            {sigNameStr}
                        </div>
                    </div>
                    
                    {/* Signatory Position */}
                    <div style={{ fontSize: sigPosFontSize, color: primaryColor, fontWeight: 700, textTransform: 'uppercase', padding: '0.1mm 0 0.4mm', textAlign: 'center', wordBreak: 'break-word' }}>
                        {sigPosStr}
                    </div>
                </div>
            </div>

            {/* Solid bottom accent bar */}
            <div style={{
                background: primaryColor,
                width: '100%',
                height: '2.0mm',
                zIndex: 2,
                margin: template === 'modern' ? '0 -0.5mm -0.5mm -0.5mm' : '0',
                printColorAdjust: 'exact',
                WebkitPrintColorAdjust: 'exact',
                borderRadius: template === 'modern' ? '0 0 2.1mm 2.1mm' : '0',
            }} />
        </div>
    );
}
