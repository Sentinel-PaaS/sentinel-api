resource "local_file" "hosts" {
  content  = <<-DOC
    [managers]
    ${aws_instance.manager1.public_ip} ansible_user=ec2-user ansible_private_key_file=./keys/managerKey.pem
    [managers:vars]
    manager_private_ip=${aws_instance.manager1.private_ip}
    [workers]
    DOC
  filename = "../ansible/inventory/hosts"
}