pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {MinterRole} from "@openzeppelin/contracts/access/roles/MinterRole.sol";
import {IAddressConfig} from "contracts/interface/IAddressConfig.sol";
import {IDevMinter} from "contracts/interface/IDevMinter.sol";
import {ILockup} from "contracts/interface/ILockup.sol";
import {IPolicyFactory} from "contracts/interface/IPolicyFactory.sol";
import {IDevProtocolAccess} from "contracts/interface/IDevProtocolAccess.sol";
import {PatchProvider} from "contracts/dao/upgrader/PatchProvider.sol";

contract DevProtocolAccess is PatchProvider, IDevProtocolAccess {
	address public addressConfig;

	constructor(address _config) public PatchProvider() {
		addressConfig = _config;
	}

	function transferOwnership(address _target, address _newOwner) external {
		bool result = hasOperatingPrivileges(msg.sender);
		if (result == false) {
			result = isPatchAddress(msg.sender);
		}
		require(result, "illegal access");
		Ownable(_target).transferOwnership(_newOwner);
	}

	function renounceMinter() public onlyAdminAndOperator {
		IDevMinter devMinter = IDevMinter(getDevMintContract());
		devMinter.renounceMinter();
	}

	function addMinter() public onlyAdminAndOperator {
		IAddressConfig config = IAddressConfig(addressConfig);
		address token = config.token();
		MinterRole role = MinterRole(token);
		address devMinter = getDevMintContract();
		if (role.isMinter(devMinter)) {
			return;
		}
		role.addMinter(devMinter);
	}

	function forceAttachPolicy(address _nextPolicy)
		external
		onlyAdminAndOperator
	{
		address policyFactoryAddress =
			IAddressConfig(addressConfig).policyFactory();
		IPolicyFactory(policyFactoryAddress).forceAttach(_nextPolicy);
	}

	function getDevMintContract() private view returns (address) {
		address lockup = IAddressConfig(addressConfig).lockup();
		return ILockup(lockup).devMinter();
	}
}
