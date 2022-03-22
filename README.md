# Sentinel
A platform as a service with built in canary deployments

# Initial Setup

1. Create a keypair called "ssh-kp" in "us-east-2" in AWS.
2. Download `ssh-kp.pem`, and move to `~/.ssh/ssh-kp.pem`.
3. Run `chmod 400 ~/.ssh/sse-kp.pem`.
4. From the root of the project directory, run `bash sentinel_init.sh`

# Test Initial Setup

1. Get the "connect" info for the manager node from your AWS account, to verify that you can ssh into the manager. e.g., `ssh -i "~/.ssh/ssh-kp.pem" ec2-user@ec2-3-129-248-115.us-east-2.compute.amazonaws.com` (make sure you update the path to reflect where your ssh key is stored, i.e., `~/.ssh/`)
2. While in your manager node, get its public ipv4 `curl http://169.254.169.254/latest/meta-data/public-ipv4` (or get this from the AWS console)
3. Visit that IP, unsecured (no https), e.g, `http://3.129.248.115/`
4. 1 out of every 3 times, you should see "THIS IS THE CANARY!!" at the bottom of the page.

# Remove Infrastructure From Test

1. From the root project directory, run `bash sentinel_destroy.sh`.