export {
    IrisGrade,
    type IrisGradeProps,
    type IrisGradeSize,
    type IrisGradeTone,
    type IrisGradeShape,
} from './components/iris-grade';
export { IrisScoreCard, type IrisScoreCardProps } from './components/iris-score-card';
export { ScoreBreakdown, type ScoreBreakdownProps } from './components/score-breakdown';
export { ScoreReasonsList, type ScoreReasonsListProps } from './components/score-reasons-list';
export { MissingFieldsBadge, type MissingFieldsBadgeProps } from './components/missing-fields-badge';
export {
    AtelierStatusBadge,
    ModerationStatusBadge,
    type AtelierStatusBadgeProps,
    type ModerationStatusBadgeProps,
    type StatusBadgeSize,
} from './components/status-badge';
export { ScoreCapWarning, type ScoreCapWarningProps } from './components/score-cap-warning';
export { IrisMethodologyInfo, type IrisMethodologyInfoProps } from './components/iris-methodology-info';
export { Wardrobe, type WardrobeProps, type WardrobeCardItem } from './components/wardrobe';
export { PassportPhonePreview, type PassportPhonePreviewProps } from './components/passport-phone-preview';
export { CompositionList, type CompositionListProps } from './components/composition-list';
export { ManufacturingTimeline, type ManufacturingTimelineProps } from './components/manufacturing-timeline';
export { FactureOcrViewer, type FactureOcrViewerProps } from './components/facture-ocr-viewer';

export { PassportHeader, type PassportHeaderProps } from './components/passport-header';
export { ArtisanCard, type ArtisanCardProps } from './components/artisan-card';
export { MaterialBreakdown, type MaterialBreakdownProps } from './components/material-breakdown';
export { ProductionTimeline, type ProductionTimelineProps } from './components/production-timeline';
export { CertificatesList, type CertificatesListProps } from './components/certificates-list';
export { CareGuide, type CareGuideProps } from './components/care-guide';
export { RepairersNearby, type RepairersNearbyProps } from './components/repairers-nearby';
export { PassportStatusBanner, type PassportStatusBannerProps } from './components/passport-status-banner';

export {
    GRADE_COLOR,
    GRADE_LABEL,
    AXIS_COLOR,
    AXIS_LABEL,
    gradeColor,
    gradeColorVar,
    gradeBackground,
    gradeBackgroundSolid,
    gradeBorder,
    gradeBorder2px,
    type GradeColorToken,
} from './theme/grade-color';
export {
    FIBER_LABEL,
    GARMENT_KIND_LABEL,
    STAGE_LABEL,
    GARMENT_CATEGORY_LABEL,
    garmentCategoryLabel,
    CARE_SYMBOLS,
    careSymbol,
    type CareSymbol,
} from './theme/dpp-labels';

export { useComputeScore } from './hooks/use-compute-score';
export { useUniqueCertificates } from './hooks/use-unique-certificates';
