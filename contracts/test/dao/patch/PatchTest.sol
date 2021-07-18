pragma solidity 0.5.17;

import {PatchBase} from "contracts/dao/patch/PatchBase.sol";
import {Allocator} from "contracts/src/allocator/Allocator.sol";
import {MarketFactory} from "contracts/src/market/MarketFactory.sol";
import {MetricsFactory} from "contracts/src/metrics/MetricsFactory.sol";
import {PropertyFactory} from "contracts/src/property/PropertyFactory.sol";
import {Withdraw} from "contracts/src/withdraw/Withdraw.sol";
import {VoteCounter} from "contracts/src/vote/VoteCounter.sol";
import {PropertyGroup} from "contracts/src/property/PropertyGroup.sol";
import {PolicyGroup} from "contracts/src/policy/PolicyGroup.sol";
import {PolicyFactory} from "contracts/src/policy/PolicyFactory.sol";
import {MetricsGroup} from "contracts/src/metrics/MetricsGroup.sol";
import {MarketGroup} from "contracts/src/market/MarketGroup.sol";
import {Lockup} from "contracts/src/lockup/Lockup.sol";
import {DevMinter} from "contracts/src/dev/DevMinter.sol";
import {UsingStorage} from "contracts/src/common/storage/UsingStorage.sol";

contract PatchPlane is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function getDevMinterTest() external view returns (address) {
		return getDevMinter();
	}

	function run() external onlyUpgrader whenNotPaused {
		StorageContract tmp = new StorageContract();
		afterDeployLockup(address(tmp));
	}
}

contract PatchAllocator is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		Allocator tmp = new Allocator(config);
		afterDeployAllocator(address(tmp));
	}
}

contract PatchMarketFactory is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		MarketFactory tmp = new MarketFactory(config);
		afterDeployMarketFactory(address(tmp));
	}
}

contract PatchMetricsFactory is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		MetricsFactory tmp = new MetricsFactory(config);
		afterDeployMetricsFactory(address(tmp));
	}
}

contract PatchPropertyFactory is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		PropertyFactory tmp = new PropertyFactory(config);
		afterDeployPropertyFactory(address(tmp));
	}
}

contract PatchWithdraw is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		Withdraw tmp =
			new Withdraw(config, 0x6A0A88907548a5601857191aAD8727884881Ac46);
		afterDeployWithdraw(address(tmp));
	}
}

contract PatchVoteCounter is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		VoteCounter tmp = new VoteCounter(config);
		afterDeployVoteCounter(address(tmp));
	}
}

contract PatchPropertyGroup is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		PropertyGroup tmp = new PropertyGroup(config);
		afterDeployPropertyGroup(address(tmp));
	}
}

contract PatchPolicyGroup is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		PolicyGroup tmp = new PolicyGroup(config);
		afterDeployPolicyGroup(address(tmp));
	}
}

contract PatchPolicyFactory is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		PolicyFactory tmp = new PolicyFactory(config);
		afterDeployPolicyFactory(address(tmp));
	}
}

contract PatchMetricsGroup is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		MetricsGroup tmp = new MetricsGroup(config);
		afterDeployMetricsGroup(address(tmp));
	}
}

contract PatchMarketGroup is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		MarketGroup tmp = new MarketGroup(config);
		afterDeployMarketGroup(address(tmp));
	}
}

contract PatchLockup is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		Lockup tmp =
			new Lockup(config, 0x6A0A88907548a5601857191aAD8727884881Ac46);
		afterDeployLockup(address(tmp));
	}
}

contract PatchPlane2 is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		PlaneContract tmp = new PlaneContract();
		afterDeployAllocator(address(tmp));
	}
}

contract PatchLockup2 is PatchBase {
	constructor(address _upgrader) public PatchBase(_upgrader) {}

	function run() external onlyUpgrader whenNotPaused {
		DevMinter minter = DevMinter(config);
		Lockup tmp = new Lockup(config, address(minter));
		afterDeployLockup(address(tmp));
	}
}

contract PlaneContract {}

contract StorageContract is UsingStorage {
	constructor() public UsingStorage() {}

	function getValue() external view returns (uint256) {
		return eternalStorage().getUint("hoge");
	}

	function increment() external {
		uint256 i = eternalStorage().getUint("hoge");
		i++;
		eternalStorage().setUint("hoge", i);
	}
}
