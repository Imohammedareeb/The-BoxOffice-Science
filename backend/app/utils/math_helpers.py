"""
Math helpers for financial calculations.
"""
import math


def clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def compound_growth(principal: float, rate: float, periods: int) -> float:
    """Compound growth formula: P(1+r)^n"""
    return principal * math.pow(1 + rate / 100, periods)


def present_value(future_value: float, rate: float, periods: int) -> float:
    """Discounted present value."""
    return future_value / math.pow(1 + rate / 100, periods)


def break_even_multiplier(budget: float, distributor_split: float, tax_rate: float) -> float:
    """Minimum revenue multiplier to break even after splits and taxes."""
    net_factor = (1 - distributor_split / 100) * (1 - tax_rate / 100)
    return 1 / net_factor if net_factor > 0 else float("inf")
