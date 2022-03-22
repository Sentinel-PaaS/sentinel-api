### variable.tf
variable "aws_region" {
  description = "AWS region on which we will setup the swarm cluster"
  default     = "us-east-2"
}
variable "ami" {
  description = "Amazon Linux 2 AMI"
  default     = "ami-064ff912f78e3e561"
}
variable "instance_type" {
  description = "Instance type"
  default     = "t2.micro"
}
# variable "key_path" {
#   description = "SSH Public Key path"
#   default     = "~/ssh-keys/ec2-docker.pem"
# }
variable "key_name" {
  description = "Desired name of Keypair..."
  default     = "ssh-kp"
}
# variable "bootstrap_path" {
#   description = "Script to install Docker Engine"
#   default     = "./install_docker_engine_compose.sh"
# }
# variable "aws_access_key" {
#   type        = string
#   description = "AWS Access Key"
#   sensitive   = true
# }
# variable "aws_secret_key" {
#   type        = string
#   description = "AWS Secret Access Key"
#   sensitive   = true
# }
