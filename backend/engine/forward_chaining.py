from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional


@dataclass
class Rule:
    name: str
    condition: Callable[[Dict[str, Any]], bool]
    action: Callable[[Dict[str, Any]], Optional[Dict[str, Any]]]
    priority: int = 100


class ForwardChainer:
    """Iterative forward-chaining engine.

    Each cycle scans every rule; a rule fires once when its condition holds
    against the current working memory. Firing may update facts, which can
    enable other rules. The loop runs until no new rule fires.
    """

    def __init__(self, rules: List[Rule]):
        self.rules = sorted(rules, key=lambda r: r.priority)

    def run(self, initial_facts: Dict[str, Any]) -> Dict[str, Any]:
        facts: Dict[str, Any] = dict(initial_facts)
        facts.setdefault("recommendations", [])
        facts.setdefault("pathway", [])
        facts.setdefault("alerts", [])
        facts.setdefault("_fired", set())

        changed = True
        cycles = 0
        while changed and cycles < 64:
            changed = False
            cycles += 1
            for rule in self.rules:
                if rule.name in facts["_fired"]:
                    continue
                try:
                    if rule.condition(facts):
                        new_facts = rule.action(facts) or {}
                        for k, v in new_facts.items():
                            facts[k] = v
                        facts["_fired"].add(rule.name)
                        changed = True
                except Exception as exc:
                    facts.setdefault("_errors", []).append(f"{rule.name}: {exc}")
        facts["_cycles"] = cycles
        facts["_fired"] = sorted(facts["_fired"])
        return facts
