output "droplet_ip" {
  description = "Dia chi IP cong khai cua VPS - dung de SSH va tro domain (ban ghi A) sau nay."
  value       = digitalocean_droplet.pinslocal.ipv4_address
}
