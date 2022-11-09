import { useRef, useEffect } from 'preact/hooks';

/** Schedules method for later and returns cancellation method. */
export const useTimeout = (callback: () => void, delay: number) => {
    const savedCallback = useRef(callback);
    const cancel = useRef<NodeJS.Timeout | undefined>(undefined);
    const undo = () => cancel.current && clearTimeout(cancel.current);

    useEffect(() => {
        cancel.current = setTimeout(savedCallback.current, delay);
        return undo;
    }, [delay]);

    return undo;
};
