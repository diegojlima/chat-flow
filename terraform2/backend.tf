
terraform {
  backend "s3" {
    bucket = "tf-state-bucket-chat-flow"
    key    = "terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "terraform-lock-table"
    encrypt = true
  }
}
