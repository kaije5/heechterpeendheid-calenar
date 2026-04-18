import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast with addToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast('Test message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('removes a toast with removeToast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      toastId = result.current.addToast('Test message', 'info');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('provides toast.success helper', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.success('Success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('provides toast.error helper', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.error('Error message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('provides toast.info helper', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast.info('Info message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('generates unique IDs for each toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.addToast('Message 1', 'info');
      result.current.addToast('Message 2', 'info');
    });

    const ids = result.current.toasts.map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
