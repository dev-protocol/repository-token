contract('PropertyFactory', ([deployer]) => {
	const propertyFactoryContract = artifacts.require('property/PropertyFactory')
	const propertyContract = artifacts.require('property/Property')
	const propertyGroupContract = artifacts.require('property/PropertyGroup')
	const stateContract = artifacts.require('State')
	const policyContract = artifacts.require('policy/PolicyTest')
	const policyFactoryContract = artifacts.require('policy/PolicyFactory')

	describe('createProperty', () => {
		var propertyFactory: any
		var propertyGroup: any
		var state: any
		var expectedPropertyAddress: any
		var deployedProperty: any
		var policy: any
		var policyFactory: any

		beforeEach(async () => {
			state = await stateContract.new({from: deployer})
			policy = await policyContract.new({from: deployer})
			policyFactory = await policyFactoryContract.new({from: deployer})
			propertyGroup = await propertyGroupContract.new({from: deployer})
			await state.setPolicyFactory(policyFactory.address, {from: deployer})
			await state.setPropertyGroup(propertyGroup.address, {from: deployer})
			await propertyGroup.changeStateAddress(state.address, {from: deployer})
			await policyFactory.changeStateAddress(state.address, {from: deployer})
			await policyFactory.createPolicy(policy.address)
			propertyFactory = await propertyFactoryContract.new({from: deployer})
			await state.setPropertyFactory(propertyFactory.address, {from: deployer})
			await propertyFactory.changeStateAddress(state.address, {from: deployer})
			const result = await propertyFactory.createProperty('sample', 'SAMPLE', {
				from: deployer
			})
			expectedPropertyAddress = await result.logs.filter(
				(e: {event: string}) => e.event === 'Create'
			)[0].args._property
		})

		it('Create a new Property Contract and emit Create Event telling created property address', async () => {
			// eslint-disable-next-line @typescript-eslint/await-thenable
			deployedProperty = await propertyContract.at(expectedPropertyAddress)
			const name = await deployedProperty.name({from: deployer})
			const symbol = await deployedProperty.symbol({from: deployer})
			const decimals = await deployedProperty.decimals({from: deployer})
			const totalSupply = await deployedProperty.totalSupply({from: deployer})
			expect(name).to.be.equal('sample')
			expect(symbol).to.be.equal('SAMPLE')
			expect(decimals.toNumber()).to.be.equal(18)
			expect(totalSupply.toNumber()).to.be.equal(10000000)
		})

		it('Adds a new Property Contract address to State Contract', async () => {
			const isProperty = await propertyGroup.isProperty(
				expectedPropertyAddress,
				{
					from: deployer
				}
			)
			expect(isProperty).to.be.equal(true)
		})
	})
})
