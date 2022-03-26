### main.tf
# Specify the provider and access details
provider "aws" {
  # use environment variables to specify AWS access and secret access keys
  region     = var.aws_region
}
resource "aws_instance" "manager1" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = ["${aws_security_group.tf_sgswarm.id}", "${aws_security_group.tf_allow_http.id}", "${aws_security_group.tf_ssh.id}", "${aws_security_group.tf_traefik_dashboard.id}"]
  tags = {
    Name = "tf manager 1"
  }
}
resource "aws_instance" "worker1" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = ["${aws_security_group.tf_sgswarm.id}", "${aws_security_group.tf_ssh.id}"]
  tags = {
    Name = "tf worker 1"
  }
}
resource "aws_instance" "worker2" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = ["${aws_security_group.tf_sgswarm.id}", "${aws_security_group.tf_ssh.id}"]
  tags = {
    Name = "tf worker 2"
  }
}
