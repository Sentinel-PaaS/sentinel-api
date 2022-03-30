resource "tls_private_key" "worker_pk_1" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
resource "aws_key_pair" "worker_kp_1" {
  key_name   = "workerKey1"       # Create a "workerKey" in AWS.
  public_key = tls_private_key.worker_pk_1.public_key_openssh

  provisioner "local-exec" { # Export "workerKey1.pem" to the API server.
    command = "echo '${tls_private_key.worker_pk_1.private_key_pem}' > ~/.ssh/workerKey1.pem"
  }
  depends_on = [
    tls_private_key.worker_pk_1
  ]
}
resource "aws_instance" "worker1" {
  ami                    = var.ami
  instance_type          = var.instance_type
  key_name               = "workerKey1"
  vpc_security_group_ids = ["${aws_security_group.tf_sgswarm.id}", "${aws_security_group.tf_ssh.id}"]
  tags = {
    Name = "tf worker 1"
  }
  depends_on = [
    aws_key_pair.worker_kp_1
  ]
}
output "worker1_public_ip" {
  value = ["${aws_instance.worker1.public_ip}"]
}
output "worker1_private_ip" {
  value = ["${aws_instance.worker1.private_ip}"]
}
