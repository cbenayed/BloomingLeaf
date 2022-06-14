/**
 * 
 */
package simulation;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import merge.MMain;

/**
 * @author A.M.Grubb
 *
 */
public class Actor extends AbstractLinkableElement {
	String actorType;
	String[] embeds;

	public Actor(String nodeID, String nodeName, String nodeType, String[] embeds){
		super(nodeID, nodeName);
		// nodeType indicates whether it is an Actor, Role, or Agent.
		actorType = nodeType;
		// store actor's embedded intentions for merge algorithm
		this.embeds = embeds;
	}
	public Actor(String nodeID, String nodeName, String nodeType, String[] embeds, String uniqueID){
		super(nodeID, nodeName, uniqueID);
		// nodeType indicates whether it is an Actor, Role, or Agent.
		actorType = nodeType;
		// store actor's embedded intentions for merge algorithm
		this.embeds = embeds;
	}

	public String getActorType() {
		return actorType;
	}
	
	/*
	 * Return ids of intentions (and links, for some reason) embedded in the actor
	 */
	public String[] getEmbeds() {
		return embeds;
	} 
	
	public boolean addEmbed(AbstractElement newEmbed) {
		
		for(String id: embeds) {
			if(id.equals(newEmbed.getUniqueID())) return false;
		}
		ArrayList<String> temp_embeds = new ArrayList<String>(Arrays.asList(embeds));
		temp_embeds.add(newEmbed.getUniqueID());
		embeds = new String[temp_embeds.size()];
		for(int i = 0; i < embeds.length; i ++) {
			embeds[i] = temp_embeds.get(i);
		}
		return true;
	}
}
