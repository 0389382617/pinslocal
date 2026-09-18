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

# DigitalOcean KHONG tu chan cong nao cho droplet moi (khac AWS Security Group
# mac dinh deny-all) - phai tu khai bao firewall, neu khong SSH (22) va moi cong
# khac mo he dieu hanh dang lang nghe deu bi expose ra toan bo internet vo thoi han.
resource "digitalocean_firewall" "pinslocal" {
  name = "pinslocal-firewall"

  droplet_ids = [digitalocean_droplet.pinslocal.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
