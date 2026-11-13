PYTHON ?= python3
export PYTHONPATH := src
export MPLBACKEND := Agg

CONFIG ?= configs/default.yaml
INPUT ?= data/processed/cohort.csv
MODEL ?= runs/latest/model.joblib
OUTPUT ?= data/processed/predictions.csv

.PHONY: help data train predict test lint format check clean

help:
	@echo "make data      Generate a synthetic cohort at $(INPUT)"
	@echo "make train     Train and evaluate (CONFIG=$(CONFIG))"
	@echo "make predict   Batch-score INPUT with MODEL"
	@echo "make test      Run the test suite"
	@echo "make lint      Ruff lint"
	@echo "make format    Ruff format"
	@echo "make clean     Remove caches and run artifacts"

data:
	$(PYTHON) scripts/generate_synthetic.py --output $(INPUT)

train:
	$(PYTHON) -m medml.train --config $(CONFIG)

predict:
	$(PYTHON) -m medml.predict --model $(MODEL) --input $(INPUT) --output $(OUTPUT)

test:
	$(PYTHON) -m pytest

lint:
	$(PYTHON) -m ruff check src tests scripts

format:
	$(PYTHON) -m ruff format src tests scripts

check: lint test

clean:
	rm -rf runs .pytest_cache .ruff_cache
	find . -type d -name __pycache__ -not -path './.git/*' -exec rm -rf {} +
