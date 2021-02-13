import { DevCommonInstance } from './lib/instance/common'
import { Withdraw } from './lib/instance/withdraw'
import { config } from 'dotenv'
import { ethGasStationFetcher } from '@devprotocol/util-ts'
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

	// Withdraw
	const withdraw = new Withdraw(dev)
	const currentWithdraw = await withdraw.load()
	const nextWithdraw = await withdraw.create()
	await withdraw.changeOwner(currentWithdraw, nextWithdraw)
	await withdraw.set(nextWithdraw)

	callback(null)
}

export = handler
