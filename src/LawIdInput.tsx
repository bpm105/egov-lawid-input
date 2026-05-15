'use client';
import React, { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { searchLaws, fetchRevisionCount } from './api';
import type { LawSearchResult } from './types';

export interface LawIdInputProps {
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

const isLawId = (s: string) => /^[A-Za-z0-9]+$/.test(s.trim());

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

export function LawIdInput({
  onSelect,
  onSubmit,
  onReset,
  onError,
  initialValue = '',
  loading = false,
  submitLabel = '決定',
  submitLoadingLabel = '取得中',
  hideSubmitButton = false,
  showRevisionBadge = false,
  showRepealedBadge = true,
  debounceMs = 300,
  searchLimit = 10,
  placeholder = '法令IDまたは法令名（例: 民法）',
  searchingText = '検索中…',
  noResultsText = 'キーワードにマッチする法令名がありません',
  className,
  inputClassName,
  submitButtonClassName,
  dropdownClassName,
  itemClassName,
  apiBaseUrl,
}: LawIdInputProps) {
  const [value, setValue] = useState(initialValue);
  const [pristine, setPristine] = useState(!!initialValue);
  const [suggestions, setSuggestions] = useState<LawSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchGenRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue);
    setPristine(!!initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim() || isLawId(query)) {
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      return;
    }
    const gen = ++searchGenRef.current;
    setSearching(true);
    setNoResults(false);
    setSuggestions([]);
    setShowSuggestions(false);
    const results = await searchLaws(query, searchLimit, apiBaseUrl, onError);
    if (gen !== searchGenRef.current) return;
    setSearching(false);
    setSuggestions(results);
    setNoResults(results.length === 0);
    setShowSuggestions(true);
    setSelectedIdx(-1);
    if (showRevisionBadge && results.length > 0) {
      const counts = await Promise.all(
        results.map((r) => fetchRevisionCount(r.lawId, apiBaseUrl, onError))
      );
      if (gen !== searchGenRef.current) return;
      setSuggestions((prev) => prev.map((r, i) => ({ ...r, revisionCount: counts[i] })));
    }
  }, [searchLimit, apiBaseUrl, onError, showRevisionBadge]);

  const handleChange = (v: string) => {
    setValue(v);
    if (pristine) {
      setPristine(false);
      onReset?.();
    }
    setShowSuggestions(false);
    setNoResults(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), debounceMs);
  };

  const handleFocus = () => {
    if (pristine) {
      onReset?.();
      setValue('');
      setPristine(false);
    }
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  const handleSelect = (result: LawSearchResult) => {
    setValue(result.lawId);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect?.(result);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = value.trim();
    if (trimmed && isLawId(trimmed)) onSubmit?.(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className={cn('egov-law-input', className)}>
      <form className="egov-law-input__form" onSubmit={handleSubmit}>
        <input
          className={cn('egov-law-input__input', inputClassName)}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
        />
        {!hideSubmitButton && (
          <button
            type="submit"
            className={cn('egov-law-input__submit', submitButtonClassName)}
            disabled={loading || !isLawId(value)}
          >
            {loading || searching ? (
              <>
                <span className="egov-law-input__spinner" />
                {loading ? submitLoadingLabel : searchingText}
              </>
            ) : (
              submitLabel
            )}
          </button>
        )}
      </form>

      {showSuggestions && (
        <div className={cn('egov-law-input__dropdown', dropdownClassName)}>
          {searching && <div className="egov-law-input__empty">{searchingText}</div>}
          {!searching && noResults && (
            <div className="egov-law-input__empty">{noResultsText}</div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={s.lawId}
              onClick={() => handleSelect(s)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={cn(
                'egov-law-input__item',
                i === selectedIdx && 'egov-law-input__item--active',
                itemClassName
              )}
            >
              <div className="egov-law-input__item-title">
                {s.lawTitle}
                {showRepealedBadge && s.isRepealed && (
                  <span className="egov-law-input__badge">廃止</span>
                )}
                {showRevisionBadge && s.revisionCount === 1 && (
                  <span className="egov-law-input__badge">単一施行日</span>
                )}
              </div>
              <div className="egov-law-input__item-meta">
                {s.lawNum}
                <span className="egov-law-input__item-id">{s.lawId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
