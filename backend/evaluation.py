import time
from collections.abc import Callable
from statistics import mean


def execution_time(func: Callable[[], object], *, iterations: int = 1):
    """Return average and individual execution durations for manual benchmarks."""
    times = []
    for _ in range(iterations):
        started_at = time.perf_counter()
        func()
        times.append(time.perf_counter() - started_at)
    return mean(times), times
