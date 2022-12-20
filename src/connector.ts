import { Addon, Result } from './model'
import * as vscode from 'vscode'
import fs = require('fs')
import request = require('request-promise')

export class Connector {
  public async connect(): Promise<boolean> {
    try {
      let resp = await request.get(`${this.endpoint}/ping`, { timeout: 3000 })
      return resp === 'pong'
    } catch (err) {
      console.error(err)
      return false
    }
  }

  public async ping(ip: string): Promise<boolean> {
    try {
      let resp = await request.get(`http://${ip}:4000/ping`, { timeout: 3000 })
      return resp === 'pong'
    } catch (err) {
      console.error(err)
      return false
    }
  }

  public async fetchAll(): Promise<Addon[]> {
    console.log('fetch all addons')
    let json = await request.get(`${this.endpoint}/addon`)
    return JSON.parse(json)
  }

  public async download(uuid: string): Promise<fs.PathLike> {
    let url = `${this.endpoint}/addon/${uuid}?pull`
    console.log(`pull addon: (${url})`)
    var tmp = require('tmp')
    var file = tmp.fileSync().name
    console.log(`tmp save file: ${file}`)
    return new Promise((resolve, reject) => {
      request
        .get(url)
        .pipe(fs.createWriteStream(file))
        .on('finish', () => {
          resolve(file)
        })
        .on('error', (err: Error) => {
          reject(err)
        })
    })
  }

  public async push(path: fs.PathLike): Promise<Result> {
    console.log(`push ${path}`)
    const url = `${this.endpoint}/addon`
    let json = await request.post({
      url: url,
      formData: {
        file: fs.createReadStream(path)
      }
    })
    return JSON.parse(json)
  }

  private get endpoint(): string {
    const config = vscode.workspace.getConfiguration('dorajs')
    const host = config.get('host')
    if (!host) {
      throw new Error('Host not set. 没有设置 Host 地址')
    }
    return `http://${host}:4000`
  }
}

export const connector: Connector = new Connector()
