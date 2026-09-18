terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Upload public key cua chung ta len tai khoan DigitalOcean, de gan vao droplet.
# Private key (pinslocal_deploy, khong co duoi .pub) TUYET DOI khong duoc chia se/commit.
resource "digitalocean_ssh_key" "pinslocal" {
  name       = "pinslocal-deploy"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "digitalocean_droplet" "pinslocal" {
  name     = "pinslocal-vps"
  image    = "ubuntu-22-04-x64"
  region   = var.region
  size     = var.droplet_size
  ssh_keys = [digitalocean_ssh_key.pinslocal.fingerprint]

  tags = ["pinslocal", "capstone"]
}
