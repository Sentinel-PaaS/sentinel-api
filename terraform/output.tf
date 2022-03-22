### output.tf
output "manager_public_ip" {
  value = ["${aws_instance.manager1.public_ip}"]
}
output "worker1_public_ip" {
  value = ["${aws_instance.worker1.public_ip}"]
}
output "worker2_public_ip" {
  value = ["${aws_instance.worker2.public_ip}"]
}

output "manager_private_ip" {
  value = ["${aws_instance.manager1.private_ip}"]
}
output "worker1_private_ip" {
  value = ["${aws_instance.worker1.private_ip}"]
}
output "worker2_private_ip" {
  value = ["${aws_instance.worker2.private_ip}"]
}

resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    ${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/ssh-kp.pem
    [managers:vars]
    manager_private_ip=${aws_instance.manager1.private_ip}
    [workers]
    ${aws_instance.worker1.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/ssh-kp.pem
    ${aws_instance.worker2.public_ip} ansible_user=ec2-user ansible_private_key_file=~/.ssh/ssh-kp.pem
    DOC
  filename = "../ansible/inventory/hosts"
}
