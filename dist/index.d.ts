import { JSX } from 'react/jsx-runtime';

export declare function fetchRevisionCount(lawId: string, apiBaseUrl?: string, onError?: (e: unknown) => void): Promise<number | undefined>;

export declare function LawIdInput({ onSelect, onSubmit, onReset, onError, initialValue, loading, submitLabel, submitLoadingLabel, hideSubmitButton, showRevisionBadge, showRepealedBadge, debounceMs, searchLimit, placeholder, searchingText, noResultsText, className, inputClassName, submitButtonClassName, dropdownClassName, itemClassName, apiBaseUrl, }: LawIdInputProps): JSX.Element;

export declare interface LawIdInputProps {
    onSelect?: (result: LawSearchResult) => void;
    onSubmit?: (lawId: string) => void;
    onReset?: () => void;
    onError?: (e: unknown) => void;
    initialValue?: string;
    loading?: boolean;
    submitLabel?: string;
    submitLoadingLabel?: string;
    hideSubmitButton?: boolean;
    showRevisionBadge?: boolean;
    showRepealedBadge?: boolean;
    debounceMs?: number;
    searchLimit?: number;
    placeholder?: string;
    searchingText?: string;
    noResultsText?: string;
    className?: string;
    inputClassName?: string;
    submitButtonClassName?: string;
    dropdownClassName?: string;
    itemClassName?: string;
    apiBaseUrl?: string;
}

export declare interface LawSearchResult {
    lawId: string;
    lawTitle: string;
    lawNum: string;
    isRepealed: boolean;
    revisionCount?: number;
}

export declare function searchLaws(query: string, limit?: number, apiBaseUrl?: string, onError?: (e: unknown) => void): Promise<LawSearchResult[]>;

export { }
