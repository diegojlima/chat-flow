
resource "aws_docdb_cluster" "example" {
  cluster_identifier      = "docdb-cluster-example"
  master_username         = var.mongodb_username
  master_password         = var.mongodb_password
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
}
