### main.tf
# Specify the provider and access details
provider "aws" {
  # use environment variables to specify AWS access and secret access keys
  region     = var.aws_region
}
resource "tls_private_key" "manager_pk" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
resource "aws_key_pair" "manager_kp" {
  key_name   = "managerKey"       # Create a "managerKey" on AWS.
  public_key = tls_private_key.manager_pk.public_key_openssh

  provisioner "local-exec" { # Create a "managerKey.pem" on the API server.
    command = "echo '${tls_private_key.manager_pk.private_key_pem}' > ../keys/managerKey.pem"
  }
  depends_on = [
    tls_private_key.manager_pk
  ]
}

resource "aws_instance" "manager1" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = "managerKey"
  vpc_security_group_ids = ["${aws_security_group.tf_sgswarm.id}", "${aws_security_group.tf_allow_http.id}", "${aws_security_group.tf_ssh.id}", "${aws_security_group.tf_traefik_dashboard.id}", "${aws_security_group.tf_docker_api.id}"]
  tags = {
    Name = "tf manager 1"
  }
  depends_on = [
    aws_key_pair.manager_kp
  ]
}
output "manager_public_ip" {
  value = ["${aws_instance.manager1.public_ip}"]
}
output "manager_private_ip" {
  value = ["${aws_instance.manager1.private_ip}"]
}
