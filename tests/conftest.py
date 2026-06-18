import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAMBDAS = ROOT / "infra" / "lambdas"
if str(LAMBDAS) not in sys.path:
    sys.path.insert(0, str(LAMBDAS))
