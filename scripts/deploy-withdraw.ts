/* eslint-disable no-undef */
import {DevCommonInstance} from './lib/instance/common'
import {Withdraw} from './lib/instance/withdraw'
import {WithdrawStorage} from './lib/instance/withdraw-storage'
import {config} from 'dotenv'
import {createFastestGasPriceFetcher} from './lib/ethgas'
import {ethgas} from './lib/api'
config()
const {CONFIG: configAddress, EGS_TOKEN: egsApiKey} = process.env

const handler = async (
	callback: (err: Error | null) => void
): Promise<void> => {
	if (!configAddress || !egsApiKey) {
		return
	}

	const gasFetcher = async () => 6721975
	const gasPriceFetcher = createFastestGasPriceFetcher(ethgas(egsApiKey), web3)
	const dev = new DevCommonInstance(
		artifacts,
		configAddress,
		gasFetcher,
		gasPriceFetcher
	)
	await dev.prepare()

	// Withdraw
	const withdraw = new Withdraw(dev)
	const nextWithdraw = await withdraw.create()
	await withdraw.set(nextWithdraw)

	// Withdraw storage
	const withdrawStorage = new WithdrawStorage(dev)
	const oldWithdrawStorage = await withdrawStorage.load()
	const nextWithdrawStorage = await withdrawStorage.create()
	await withdrawStorage.changeOwner(oldWithdrawStorage, nextWithdrawStorage)
	await withdrawStorage.set(nextWithdrawStorage)

	callback(null)
}

export = handler
