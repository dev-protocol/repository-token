import { ethGasStationFetcher } from '@devprotocol/util-ts'
import { config } from 'dotenv'
import { DevCommonInstance } from './lib/instance/common'
import { Lockup } from './lib/instance/lockup'
import { Withdraw } from './lib/instance/withdraw'

config()
const { CONFIG: configAddress, EGS_TOKEN: egsApiKey } = process.env

const handler = async (
	callback: (err: Error | null) => void
): Promise<void> => {
	if (!configAddress || !egsApiKey) {
		return
	}

	const gasFetcher = async () => 6721975
	const gasPriceFetcher = ethGasStationFetcher(egsApiKey)
	const dev = new DevCommonInstance(
		artifacts,
		configAddress,
		gasFetcher,
		gasPriceFetcher
	)
	await dev.prepare()

	const devMinter = await dev.artifacts
		.require('DevMinter')
		.new(dev.addressConfig.address, await dev.gasInfo)
	console.log('DevMinter contract', devMinter.address)

	await dev.dev.addMinter(devMinter.address, await dev.gasInfo)

	const l = new Lockup(dev)
	const lCurrent = await l.load()
	const lNext = await l.create(devMinter.address)
	await l.changeOwner(lCurrent, lNext)
	await l.set(lNext)

	const w = new Withdraw(dev)
	const wCurrent = await w.load()
	const wNext = await w.create(devMinter.address)
	await w.changeOwner(wCurrent, wNext)
	await w.set(wNext)

	await Promise.all([
		l.changeOwner(lCurrent, lNext),
		l.set(lNext),
		w.changeOwner(wCurrent, wNext),
		w.set(wNext),
	])

	callback(null)
}

export = handler
