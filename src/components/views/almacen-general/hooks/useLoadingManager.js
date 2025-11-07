import { useState, useCallback } from 'react';

function useLoadingManager({
    shouldShowSpinner = () => false,
    enableRefreshIndicator = () => false,
    refreshHideDelay = 300,
    refreshFadeDelay = 500,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleLoadingStart = useCallback(() => {
        if (shouldShowSpinner()) {
            setIsLoading(true);
        }
        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (enableRefreshIndicator() && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [enableRefreshIndicator, shouldShowSpinner]);

    const handleLoadingEnd = useCallback(() => {
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0) {
                setIsLoading(false);
                if (enableRefreshIndicator()) {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setTimeout(() => {
                            setShowRefreshIndicator(false);
                        }, refreshFadeDelay);
                    }, refreshHideDelay);
                }
            }
            return newCount;
        });
    }, [enableRefreshIndicator, refreshFadeDelay, refreshHideDelay]);

    return {
        isLoading,
        showRefreshIndicator,
        isRefreshing,
        activeRequests,
        handleLoadingStart,
        handleLoadingEnd,
    };
}

export default useLoadingManager;

