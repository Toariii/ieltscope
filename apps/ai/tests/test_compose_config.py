from pathlib import Path

import yaml


def test_compose_declares_private_dependencies() -> None:
    compose_path = Path(__file__).parents[3] / "docker-compose.yml"
    compose = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

    assert set(compose["services"]) == {"minio", "minio-init", "postgres", "redis"}
    assert compose["services"]["minio-init"]["depends_on"]["minio"]["condition"] == "service_healthy"
    assert set(compose["volumes"]) == {"minio_data", "postgres_data", "redis_data"}
